import { Client, GatewayIntentBits, Role } from 'discord.js';
import { config } from './config';

/**
 * Atribui um cargo (ex.: "2ª fase") a todas as pessoas que votaram numa
 * resposta específica (ex.: "Sim") de uma sondagem NATIVA do Discord.
 *
 * Variáveis de ambiente:
 *   DISCORD_POLL_CHANNEL_ID   (obrigatória) canal onde está a sondagem
 *   DISCORD_POLL_MESSAGE_ID   (obrigatória) mensagem da sondagem
 *   POLL_ANSWER_TEXT          (opcional, por defeito "Sim")
 *   SECOND_PHASE_ROLE_NAME    (opcional, por defeito "2ª fase")
 *
 * Correr:  npm run assign:2fase
 *
 * O bot precisa da permissão "Gerir cargos" e o seu cargo tem de estar ACIMA
 * do cargo a atribuir na hierarquia do servidor.
 */

// Aceita o ID da mensagem em vários formatos: snowflake simples ("123"),
// o formato "canalId-mensagemId" (que o Discord copia às vezes) ou um link
// completo (.../channels/guild/canal/mensagem). Deriva o canal quando possível.
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
// Índice da resposta na poll (1 = a primeira, normalmente "Sim"). Usado quando
// o Discord não devolve a estrutura da poll na mensagem e não dá para mapear
// pelo texto. Por defeito 1.
const POLL_ANSWER_ID = Number.parseInt(process.env.POLL_ANSWER_ID || '1', 10);
const ROLE_NAME = (process.env.SECOND_PHASE_ROLE_NAME || '2ª fase').trim();
// Para sondagens feitas por REAÇÃO: o emoji que conta como voto (ex.: "certo").
// Aceita nome de emoji personalizado, com ou sem dois-pontos, ou um emoji unicode.
const REACTION_EMOJI = (process.env.REACTION_EMOJI || 'certo').trim();
// Modo simulação: lê e conta os votantes, mas não cria o cargo nem o atribui.
const DRY_RUN = ['1', 'true', 'yes', 'sim'].includes((process.env.DRY_RUN || '').toLowerCase());

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Normaliza um texto de resposta para comparação: minúsculas e sem emojis
// (personalizados <:nome:id>, shortcodes :nome: e emojis unicode). Mantém
// letras acentuadas e números. Assim ":certo: Sim", "<:certo:123> Sim" e
// "Sim" ficam todos como "sim".
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
      const channel = await client.channels.fetch(CHANNEL_ID);
      if (!channel || !channel.isTextBased()) {
        console.error('Canal inválido ou não é de texto.');
        return;
      }

      const message = await channel.messages.fetch(MESSAGE_ID);

      const voterIds = new Set<string>();
      let voteLabel = '';

      // Determina o ID da resposta da poll. Se a estrutura da poll vier na
      // mensagem, mapeia pelo texto (ex.: "Sim"); caso contrário usa POLL_ANSWER_ID.
      let answerId: number | undefined;
      if (message.poll) {
        const answers = [...message.poll.answers.values()];
        const target = normalizeAnswer(ANSWER_TEXT);
        const answer =
          answers.find((a) => normalizeAnswer(a.text || '') === target) ||
          answers.find((a) => normalizeAnswer(a.text || '').includes(target));
        if (!answer) {
          console.error(
            `Não encontrei a resposta "${ANSWER_TEXT}". Respostas disponíveis: ` +
              answers.map((a) => `"${a.text}"`).join(', '),
          );
          return;
        }
        answerId = answer.id;
        voteLabel = answer.text || ANSWER_TEXT;
      } else if (Number.isFinite(POLL_ANSWER_ID)) {
        answerId = POLL_ANSWER_ID;
        voteLabel = `${ANSWER_TEXT} (resposta #${answerId})`;
      }

      // Tenta o endpoint dedicado de polls (funciona mesmo quando a mensagem
      // não traz a estrutura da poll). Se não for uma poll, cai para reações.
      let isPoll = answerId !== undefined;
      if (answerId !== undefined) {
        try {
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
        } catch (err: unknown) {
          const status = (err as { status?: number })?.status;
          const msg = err instanceof Error ? err.message : '';
          if (status === 404 || /Unknown Poll/i.test(msg)) {
            isPoll = false; // Não é uma poll; tenta reações em baixo.
          } else {
            throw err;
          }
        }
      }

      if (!isPoll) {
        // --- Votação por reação: quem reagiu com o emoji (ex.: :certo: = "Sim") ---
        const wanted = REACTION_EMOJI.replace(/:/g, '').trim().toLowerCase();
        const reaction = message.reactions.cache.find((r) => {
          const name = (r.emoji.name || '').toLowerCase();
          return name === wanted || r.emoji.toString() === REACTION_EMOJI || String(r.emoji.id) === REACTION_EMOJI;
        });
        if (!reaction) {
          const lista = message.reactions.cache.size
            ? message.reactions.cache.map((r) => `${r.emoji.name ?? r.emoji.toString()} (${r.count})`).join(', ')
            : 'nenhuma';
          console.error(`Não encontrei a reação "${REACTION_EMOJI}". Reações na mensagem: ${lista}`);
          return;
        }
        voteLabel = reaction.emoji.name ?? REACTION_EMOJI;
        let after: string | undefined;
        for (;;) {
          const page = await reaction.users.fetch({ limit: 100, after });
          if (page.size === 0) break;
          for (const [id, user] of page) {
            if (!user.bot) voterIds.add(id);
          }
          if (page.size < 100) break;
          after = page.lastKey();
        }
      }

      console.log(`Votantes em "${voteLabel}": ${voterIds.size}`);

      // Cria (ou reutiliza) o cargo. Em dry-run não cria nada.
      let role: Role | undefined = guild.roles.cache.find((r) => r.name === ROLE_NAME);
      if (role) {
        console.log(`Cargo reutilizado: ${role.name}`);
      } else if (DRY_RUN) {
        console.log(`(dry-run) O cargo "${ROLE_NAME}" não existe; seria criado.`);
      } else {
        role = await guild.roles.create({ name: ROLE_NAME, mentionable: true, reason: 'Cargo da 2ª fase' });
        console.log(`Cargo criado: ${role.name}`);
      }

      if (DRY_RUN) {
        console.log(
          `(dry-run) Nada foi alterado. Seriam atribuídos o cargo "${ROLE_NAME}" a ${voterIds.size} votante(s).`,
        );
        return;
      }

      // Atribui o cargo, com pausa para respeitar os limites de taxa do Discord.
      let assigned = 0;
      let skipped = 0;
      for (const userId of voterIds) {
        const member = await guild.members.fetch(userId).catch(() => null);
        if (!member) {
          skipped++;
          continue;
        }
        if (member.roles.cache.has(role!.id)) {
          skipped++;
          continue;
        }
        await member.roles.add(role!, `Votou "${voteLabel}" na sondagem da 2ª fase`);
        assigned++;
        await sleep(600);
      }

      console.log(`Concluído. Cargo atribuído a ${assigned} pessoa(s); ${skipped} ignorada(s).`);
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
