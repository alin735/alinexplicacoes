import { Client, GatewayIntentBits, GuildMember, Role } from 'discord.js';
import { config } from './config';

/**
 * Cria o cargo "Matemática Secundário" e atribui-o a todas as pessoas que:
 *   1) votaram "Sim" numa sondagem NATIVA do Discord, E
 *   2) têm atualmente o cargo "7º-9º ano".
 *
 * Variáveis de ambiente:
 *   DISCORD_POLL_CHANNEL_ID   canal da sondagem (opcional se o MESSAGE_ID for um link)
 *   DISCORD_POLL_MESSAGE_ID   mensagem da sondagem (aceita id, "canal-msg" ou link completo)
 *   POLL_ANSWER_TEXT          resposta a contar (por defeito "Sim"; ":certo: Sim" também funciona)
 *   REQUIRED_ROLE_NAME        cargo que o membro tem de ter (por defeito "7º-9º ano")
 *   MAT_SEC_ROLE_NAME         nome do cargo a criar (por defeito "Matemática Secundário")
 *   DRY_RUN=1                 só simula: mostra quem receberia o cargo, sem mexer em nada
 *
 * Correr:  npm run assign:matsec
 *
 * O bot precisa da permissão "Gerir cargos" e o seu cargo tem de estar ACIMA
 * do cargo a atribuir na hierarquia do servidor.
 */

function extractIds(rawMessage?: string, rawChannel?: string) {
  let channelId = rawChannel?.trim() || undefined;
  let messageId = rawMessage?.trim() || undefined;

  if (messageId) {
    const link = messageId.match(/channels\/\d+\/(\d+)\/(\d+)/);
    if (link) {
      channelId = channelId || link[1];
      messageId = link[2];
    } else if (messageId.includes('-')) {
      const parts = messageId.split('-').map((p) => p.trim()).filter(Boolean);
      messageId = parts[parts.length - 1];
      channelId = channelId || parts[parts.length - 2];
    }
  }

  return { channelId, messageId };
}

const { channelId: CHANNEL_ID, messageId: MESSAGE_ID } = extractIds(
  process.env.DISCORD_POLL_MESSAGE_ID,
  process.env.DISCORD_POLL_CHANNEL_ID,
);
const ANSWER_TEXT = (process.env.POLL_ANSWER_TEXT || 'Sim').trim();
const POLL_ANSWER_ID = Number.parseInt(process.env.POLL_ANSWER_ID || '1', 10);
const REQUIRED_ROLE_NAME = (process.env.REQUIRED_ROLE_NAME || '7º-9º ano').trim();
const TARGET_ROLE_NAME = (process.env.MAT_SEC_ROLE_NAME || 'Matemática Secundário').trim();
const DRY_RUN = ['1', 'true', 'yes', 'sim'].includes((process.env.DRY_RUN || '').toLowerCase());

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Normaliza uma resposta para comparação: minúsculas e sem emojis. Assim
// ":certo: Sim", "<:certo:123> Sim" e "Sim" ficam todos como "sim".
function normalizeAnswer(text: string): string {
  return text
    .toLowerCase()
    .replace(/<a?:\w+:\d+>/g, ' ')
    .replace(/:[a-z0-9_+-]+:/gi, ' ')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function run() {
  if (!CHANNEL_ID || !MESSAGE_ID) {
    throw new Error('Define DISCORD_POLL_CHANNEL_ID e DISCORD_POLL_MESSAGE_ID.');
  }

  const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
  });

  client.once('clientReady', async () => {
    try {
      const guild = await client.guilds.fetch(config.guildId);
      await guild.roles.fetch();

      // --- Cargo obrigatório ("7º-9º ano") ---
      const requiredRole = guild.roles.cache.find((r) => r.name === REQUIRED_ROLE_NAME);
      if (!requiredRole) {
        console.error(
          `Não encontrei o cargo "${REQUIRED_ROLE_NAME}". Cargos disponíveis:\n  ` +
            guild.roles.cache
              .filter((r) => r.name !== '@everyone')
              .map((r) => `"${r.name}"`)
              .join('\n  '),
        );
        return;
      }

      // --- Votantes do "Sim" na poll ---
      const channel = await client.channels.fetch(CHANNEL_ID);
      if (!channel || !channel.isTextBased()) {
        console.error('Canal inválido ou não é de texto.');
        return;
      }
      const message = await channel.messages.fetch(MESSAGE_ID);

      const voterIds = new Set<string>();
      let answerId: number | undefined;
      let voteLabel = ANSWER_TEXT;

      if (message.poll) {
        const answers = [...message.poll.answers.values()];
        const target = normalizeAnswer(ANSWER_TEXT);
        const answer =
          answers.find((a) => normalizeAnswer(a.text || '') === target) ||
          answers.find((a) => normalizeAnswer(a.text || '').includes(target));
        if (!answer) {
          console.error(
            `Não encontrei a resposta "${ANSWER_TEXT}". Respostas: ` +
              answers.map((a) => `"${a.text}"`).join(', '),
          );
          return;
        }
        answerId = answer.id;
        voteLabel = answer.text || ANSWER_TEXT;
      } else {
        answerId = POLL_ANSWER_ID;
        voteLabel = `${ANSWER_TEXT} (resposta #${answerId})`;
      }

      let after: string | undefined;
      for (;;) {
        const query = new URLSearchParams({ limit: '100' });
        if (after) query.set('after', after);
        const page = (await client.rest.get(
          `/channels/${CHANNEL_ID}/polls/${MESSAGE_ID}/answers/${answerId}`,
          { query },
        )) as { users?: Array<{ id: string; bot?: boolean }> };
        const users = page.users || [];
        if (users.length === 0) break;
        for (const u of users) if (!u.bot) voterIds.add(u.id);
        if (users.length < 100) break;
        after = users[users.length - 1].id;
      }

      // --- Interseção: votantes que TÊM o cargo "7º-9º ano" ---
      const eligible: GuildMember[] = [];
      let semCargo = 0;
      let jaSairam = 0;
      for (const userId of voterIds) {
        const member = await guild.members.fetch(userId).catch(() => null);
        if (!member) {
          jaSairam++;
          continue;
        }
        if (!member.roles.cache.has(requiredRole.id)) {
          semCargo++;
          continue;
        }
        eligible.push(member);
      }

      console.log(`Votaram "${voteLabel}": ${voterIds.size}`);
      console.log(`Já não estão no servidor: ${jaSairam} · Sem o cargo "${REQUIRED_ROLE_NAME}": ${semCargo}`);
      console.log(`Elegíveis (votaram Sim + têm "${REQUIRED_ROLE_NAME}"): ${eligible.length}`);
      console.log('  ' + eligible.map((m) => `${m.user.username} (${m.displayName})`).join('\n  '));

      if (DRY_RUN) {
        const roleExiste = guild.roles.cache.some((r) => r.name === TARGET_ROLE_NAME);
        console.log(
          `\n(dry-run) Nada foi alterado. Seria ${roleExiste ? 'reutilizado' : 'criado'} o cargo ` +
            `"${TARGET_ROLE_NAME}" e atribuído a ${eligible.length} pessoa(s).`,
        );
        return;
      }

      // --- Cria (ou reutiliza) o cargo alvo, simples ---
      let role: Role | undefined = guild.roles.cache.find((r) => r.name === TARGET_ROLE_NAME);
      if (role) {
        console.log(`Cargo reutilizado: ${role.name}`);
      } else {
        role = await guild.roles.create({ name: TARGET_ROLE_NAME, reason: 'Sondagem Matemática Secundário' });
        console.log(`Cargo criado: ${role.name}`);
      }

      let assigned = 0;
      let skipped = 0;
      for (const member of eligible) {
        if (member.roles.cache.has(role.id)) {
          skipped++;
          continue;
        }
        await member.roles.add(role, `Votou "${voteLabel}" e tem "${REQUIRED_ROLE_NAME}"`);
        assigned++;
        await sleep(600);
      }

      console.log(`Concluído. Cargo atribuído a ${assigned} pessoa(s); ${skipped} já o tinha(m).`);
    } catch (error) {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    } finally {
      await client.destroy();
    }
  });

  await client.login(config.discordToken);
}

void run();
