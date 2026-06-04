// Read-only replication of /ativo_mes (top mensagens do mês anterior).
// Não escreve nada no servidor; apenas lê a API do Discord com o bot token.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Carregar .env manualmente (sem imprimir segredos) ──────────────────────
const envRaw = readFileSync(join(__dirname, '..', '.env'), 'utf8');
const env = {};
for (const line of envRaw.split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
}

const TOKEN = (env.DISCORD_BOT_TOKEN || env.DISCORD_TOKEN || '').trim();
const GUILD_ID = (env.DISCORD_GUILD_ID || '').trim();
const DOUBTS_CHANNEL_ID = (env.DISCORD_DOUBTS_CHANNEL_ID || '1487542864811393136').trim();
const EXCLUDED = new Set(
  (env.DISCORD_XP_EXCLUDED_USER_IDS || '1013149135127453798')
    .split(',').map((s) => s.trim()).filter(Boolean),
);
const GERAL_CHANNEL_ID = '1449014426287210526';

if (!TOKEN) throw new Error('Sem token no .env');
if (!GUILD_ID) throw new Error('Sem DISCORD_GUILD_ID no .env');

const LISBON = 'Europe/Lisbon';
const NON_SYSTEM_TYPES = new Set([0, 19, 20, 23]); // Default, Reply, SlashCmd, ContextMenu

function lisbonMonthKey(date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: LISBON, year: 'numeric', month: '2-digit',
  }).formatToParts(date);
  const y = parts.find((p) => p.type === 'year')?.value;
  const m = parts.find((p) => p.type === 'month')?.value;
  return `${y}-${m}`;
}

function previousMonthKey(date) {
  const cur = lisbonMonthKey(date);
  const [y, m] = cur.split('-').map(Number);
  return lisbonMonthKey(new Date(Date.UTC(y, m - 2, 1)));
}

function monthLabel(key) {
  const [y, m] = key.split('-').map(Number);
  return new Intl.DateTimeFormat('pt-PT', { timeZone: LISBON, month: 'long', year: 'numeric' })
    .format(new Date(Date.UTC(y, m - 1, 1)));
}

async function api(path) {
  for (let attempt = 0; attempt < 6; attempt++) {
    const res = await fetch(`https://discord.com/api/v10${path}`, {
      headers: { Authorization: `Bot ${TOKEN}`, 'User-Agent': 'AlinBot-readonly/1.0' },
    });
    if (res.status === 429) {
      const body = await res.json().catch(() => ({}));
      const wait = (body.retry_after ?? 1) * 1000 + 250;
      await new Promise((r) => setTimeout(r, wait));
      continue;
    }
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`${res.status} ${res.statusText} on ${path} :: ${text.slice(0, 200)}`);
    }
    return res.json();
  }
  throw new Error(`Demasiados 429 em ${path}`);
}

function isCountable(msg) {
  if (!msg.author) return false;
  if (msg.author.bot) return false;
  if (EXCLUDED.has(msg.author.id)) return false;
  if (msg.webhook_id) return false;
  if (!NON_SYSTEM_TYPES.has(msg.type)) return false;
  return true;
}

async function countChannel(channelId, targetMonthKey) {
  const counts = new Map();
  let before;
  while (true) {
    const q = new URLSearchParams({ limit: '100' });
    if (before) q.set('before', before);
    const batch = await api(`/channels/${channelId}/messages?${q}`).catch(() => null);
    if (!batch || batch.length === 0) break;

    let sawTarget = false;
    for (const msg of batch) {
      if (!isCountable(msg)) continue;
      const key = lisbonMonthKey(new Date(msg.timestamp));
      if (key === targetMonthKey) {
        sawTarget = true;
        counts.set(msg.author.id, (counts.get(msg.author.id) ?? 0) + 1);
      }
    }

    const oldest = batch[batch.length - 1];
    if (!oldest) break;
    const oldestKey = lisbonMonthKey(new Date(oldest.timestamp));
    if (oldestKey < targetMonthKey && !sawTarget) break;
    if (oldestKey < targetMonthKey) break;
    before = oldest.id;
  }
  return counts;
}

async function main() {
  const targetMonthKey = previousMonthKey(new Date());
  console.error(`Mês alvo: ${targetMonthKey} (${monthLabel(targetMonthKey)})`);

  // Canais candidatos: #geral + threads ativas cujo parent é o canal de dúvidas.
  const channelIds = [GERAL_CHANNEL_ID];
  const active = await api(`/guilds/${GUILD_ID}/threads/active`).catch(() => null);
  if (active?.threads) {
    for (const t of active.threads) {
      if (t.parent_id === DOUBTS_CHANNEL_ID) channelIds.push(t.id);
    }
  }
  console.error(`Canais a contar: ${channelIds.length} (1 #geral + ${channelIds.length - 1} threads de dúvidas)`);

  const aggregated = new Map();
  for (const id of channelIds) {
    const c = await countChannel(id, targetMonthKey);
    c.forEach((n, uid) => aggregated.set(uid, (aggregated.get(uid) ?? 0) + n));
  }

  const top = [...aggregated.entries()]
    .map(([userId, count]) => ({ userId, count }))
    .sort((a, b) => (b.count !== a.count ? b.count - a.count : a.userId.localeCompare(b.userId)))
    .slice(0, 10);

  // Resolver nomes
  const out = [];
  for (let i = 0; i < top.length; i++) {
    const u = await api(`/users/${top[i].userId}`).catch(() => null);
    const username = u?.username ?? '(desconhecido)';
    const display = u?.global_name ?? username;
    out.push(`${i + 1}. ${display} (@${username}) — ${top[i].count} mensagens`);
  }

  console.error('\n===== TOP 10 =====');
  console.log(`Top 10 de ${monthLabel(targetMonthKey)} (canais: #geral + threads de dúvidas):\n`);
  console.log(out.join('\n'));
}

main().catch((e) => { console.error('ERRO:', e.message); process.exit(1); });
