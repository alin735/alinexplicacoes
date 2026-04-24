import fs from 'fs';
import path from 'path';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ChatInputCommandInteraction,
  Client,
  EmbedBuilder,
  Guild,
  GuildMember,
  MessageFlags,
  PartialGuildMember,
} from 'discord.js';
import { config } from './config';
import { getSupabase } from './database';

type ChallengeStatus = 'draft' | 'scheduled' | 'running' | 'paused' | 'completed';
type SchoolYear = '9ano' | '12ano';
type AnswerOption = 'A' | 'B' | 'C' | 'D';

type ChallengeConfigRow = {
  guild_id: string;
  status: ChallengeStatus;
  start_at: string | null;
  challenge_days: number;
  question_xp: number;
  invite_points: number;
  channel_9ano_id: string | null;
  channel_12ano_id: string | null;
  leaderboard_channel_id: string | null;
  leaderboard_message_id: string | null;
  updated_at: string;
};

type ChallengeQuestionRow = {
  id: string;
  guild_id: string;
  school_year: SchoolYear;
  day_index: number;
  prompt: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: AnswerOption | null;
};

type ChallengeRoundRow = {
  guild_id: string;
  school_year: SchoolYear;
  day_index: number;
  channel_id: string;
  message_id: string;
  opens_at: string;
  closes_at: string;
  status: 'open' | 'closed';
};

type ChallengeParticipantRow = {
  guild_id: string;
  discord_user_id: string;
  locked_year: SchoolYear | null;
  question_xp: number;
  invite_points: number;
  active_invites: number;
  answers_count: number;
  correct_answers: number;
  updated_at: string;
};

type InviteAttributionRow = {
  guild_id: string;
  invited_user_id: string;
  inviter_user_id: string;
  invite_code: string | null;
  is_active: boolean;
  points_applied: boolean;
};

type ImportedQuestion = {
  day: number;
  prompt: string;
  options: Record<AnswerOption, string>;
};

const ANSWER_CUSTOM_ID_PREFIX = 'challenge_answer';
const SCHEDULER_INTERVAL_MS = 30_000;
const LEADERBOARD_REFRESH_MIN_MS = 20_000;
const DAY_MS = 24 * 60 * 60 * 1000;
const CHALLENGE_INFO_CHANNEL_ID = '1496924796464922887';

const YEAR_LABEL: Record<SchoolYear, string> = {
  '9ano': '9º Ano',
  '12ano': '12º Ano',
};

const CHALLENGE_ANSWER_KEYS: Record<SchoolYear, string> = {
  '9ano': 'BBBBCABDBBBDAABACDAC',
  '12ano': 'CBBBBBCDBCBBBCBACBBA',
};

const CHALLENGE_IMAGE_PATHS: Record<SchoolYear, string[]> = {
  '9ano': [
    '/Users/alinc/Desktop/Screenshot 2026-04-22 at 18.22.17.png',
    '/Users/alinc/Desktop/Screenshot 2026-04-22 at 18.25.06.png',
    '/Users/alinc/Desktop/Screenshot 2026-04-22 at 18.24.58.png',
    '/Users/alinc/Desktop/Screenshot 2026-04-22 at 18.24.43.png',
    '/Users/alinc/Desktop/Screenshot 2026-04-22 at 18.24.33.png',
    '/Users/alinc/Desktop/Screenshot 2026-04-22 at 18.24.25.png',
    '/Users/alinc/Desktop/Screenshot 2026-04-22 at 18.24.17.png',
    '/Users/alinc/Desktop/Screenshot 2026-04-22 at 18.24.10.png',
    '/Users/alinc/Desktop/Screenshot 2026-04-22 at 18.23.57.png',
    '/Users/alinc/Desktop/Screenshot 2026-04-22 at 18.23.50.png',
    '/Users/alinc/Desktop/Screenshot 2026-04-22 at 18.23.40.png',
    '/Users/alinc/Desktop/Screenshot 2026-04-22 at 18.23.35.png',
    '/Users/alinc/Desktop/Screenshot 2026-04-22 at 18.23.24.png',
    '/Users/alinc/Desktop/Screenshot 2026-04-22 at 18.23.18.png',
    '/Users/alinc/Desktop/Screenshot 2026-04-22 at 18.23.10.png',
    '/Users/alinc/Desktop/Screenshot 2026-04-22 at 18.23.04.png',
    '/Users/alinc/Desktop/Screenshot 2026-04-22 at 18.22.58.png',
    '/Users/alinc/Desktop/Screenshot 2026-04-22 at 18.22.51.png',
    '/Users/alinc/Desktop/Screenshot 2026-04-22 at 18.22.35.png',
    '/Users/alinc/Desktop/Screenshot 2026-04-22 at 18.22.24.png',
  ],
  '12ano': [
    '/Users/alinc/Desktop/Screenshot 2026-04-22 at 18.26.31.png',
    '/Users/alinc/Desktop/Screenshot 2026-04-22 at 18.29.22.png',
    '/Users/alinc/Desktop/Screenshot 2026-04-22 at 18.29.16.png',
    '/Users/alinc/Desktop/Screenshot 2026-04-22 at 18.29.11.png',
    '/Users/alinc/Desktop/Screenshot 2026-04-22 at 18.29.05.png',
    '/Users/alinc/Desktop/Screenshot 2026-04-22 at 18.28.57.png',
    '/Users/alinc/Desktop/Screenshot 2026-04-22 at 18.28.48.png',
    '/Users/alinc/Desktop/Screenshot 2026-04-22 at 18.28.40.png',
    '/Users/alinc/Desktop/Screenshot 2026-04-22 at 18.28.33.png',
    '/Users/alinc/Desktop/Screenshot 2026-04-22 at 18.28.28.png',
    '/Users/alinc/Desktop/Screenshot 2026-04-22 at 18.28.21.png',
    '/Users/alinc/Desktop/Screenshot 2026-04-22 at 18.28.14.png',
    '/Users/alinc/Desktop/Screenshot 2026-04-22 at 18.27.40.png',
    '/Users/alinc/Desktop/Screenshot 2026-04-22 at 18.27.33.png',
    '/Users/alinc/Desktop/Screenshot 2026-04-22 at 18.27.20.png',
    '/Users/alinc/Desktop/Screenshot 2026-04-22 at 18.27.08.png',
    '/Users/alinc/Desktop/Screenshot 2026-04-22 at 18.27.00.png',
    '/Users/alinc/Desktop/Screenshot 2026-04-22 at 18.26.54.png',
    '/Users/alinc/Desktop/Screenshot 2026-04-22 at 18.26.43.png',
    '/Users/alinc/Desktop/Screenshot 2026-04-22 at 18.26.37.png',
  ],
};

function normalizeChallengeImageOrder(paths: string[]): string[] {
  if (paths.length <= 2) return paths;
  return [paths[0], ...paths.slice(1).reverse()];
}

let runtimeClient: Client | null = null;
let schedulerHandle: NodeJS.Timeout | null = null;
const inviteUsesCache = new Map<string, Map<string, number>>();
const missingTableWarnings = new Set<string>();
const lastLeaderboardRefreshAt = new Map<string, number>();

function nowIso() {
  return new Date().toISOString();
}

function clampText(text: string, max = 1024): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

function getImagePathForChallengeDay(schoolYear: SchoolYear, day: number): string | null {
  if (day < 1) return null;
  const orderedPaths = normalizeChallengeImageOrder(CHALLENGE_IMAGE_PATHS[schoolYear]);
  const imagePath = orderedPaths[day - 1];
  if (!imagePath) return null;
  if (!fs.existsSync(imagePath)) return null;
  return imagePath;
}

function getAnswerKeyOptionForDay(schoolYear: SchoolYear, day: number): AnswerOption | null {
  if (day < 1) return null;
  const key = CHALLENGE_ANSWER_KEYS[schoolYear];
  const letter = key[day - 1];
  if (!letter) return null;
  return toOption(letter);
}

function toOption(input: string): AnswerOption | null {
  const normalized = input.trim().toUpperCase();
  if (normalized === 'A' || normalized === 'B' || normalized === 'C' || normalized === 'D') {
    return normalized;
  }
  return null;
}

function challengeTableFromError(error: unknown): string | null {
  if (!error || typeof error !== 'object') return null;
  const message = String((error as { message?: string }).message || '').toLowerCase();
  const matches = message.match(/discord_exam_challenge_[a-z_]+/);
  return matches?.[0] || null;
}

function maybeLogMissingTable(error: unknown) {
  const table = challengeTableFromError(error);
  if (!table) return;
  if (missingTableWarnings.has(table)) return;
  missingTableWarnings.add(table);
  console.log(
    `Tabela ${table} não encontrada. Atualiza e executa o discord-bot/schema.sql no Supabase.`,
  );
}

function isAdmin(interaction: ChatInputCommandInteraction) {
  return Boolean(interaction.memberPermissions?.has('Administrator'));
}

function assertSchoolYear(value: string | null): SchoolYear | null {
  if (value === '9ano' || value === '12ano') return value;
  return null;
}

function parseScheduleDate(dateRaw: string, hour: number, minute: number): Date | null {
  const normalizedDate = dateRaw.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedDate)) return null;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  const built = new Date(`${normalizedDate}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`);
  if (Number.isNaN(built.getTime())) return null;
  return built;
}

function stripHtml(input: string): string {
  return input
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<li>/gi, '\n• ')
    .replace(/<\/li>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

function extractQuestionsFromHtml(html: string): ImportedQuestion[] {
  const chunks = html.split('<!-- ══ EX ').slice(1);
  const out: ImportedQuestion[] = [];

  for (const chunk of chunks) {
    const numberMatch = chunk.match(/^(\d+)\s*═/);
    if (!numberMatch) continue;
    const day = Number.parseInt(numberMatch[1], 10);
    if (!Number.isFinite(day)) continue;

    const bodyMatch = chunk.match(/<div class="ex-body">([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/);
    if (!bodyMatch) continue;
    const body = bodyMatch[1];

    const choicesMatch = body.match(/<div class="choices(?:-col)?">([\s\S]*?)<\/div>/);
    if (!choicesMatch) continue;
    const choicesHtml = choicesMatch[1];

    const options: Partial<Record<AnswerOption, string>> = {};
    const optionRegex = /<span><strong>\(([A-D])\)<\/strong>\s*([\s\S]*?)<\/span>/g;
    let optionMatch: RegExpExecArray | null = null;
    while ((optionMatch = optionRegex.exec(choicesHtml))) {
      const key = toOption(optionMatch[1]);
      if (!key) continue;
      options[key] = stripHtml(optionMatch[2]);
    }

    if (!options.A || !options.B || !options.C || !options.D) continue;

    const exTextMatch = body.match(/<div class="ex-text">([\s\S]*?)<\/div>/);
    let promptSource = exTextMatch?.[1] || '';
    if (!promptSource) {
      promptSource = body.split('<div class="choices')[0];
    }
    const prompt = clampText(stripHtml(promptSource), 1600);

    out.push({
      day,
      prompt,
      options: {
        A: options.A,
        B: options.B,
        C: options.C,
        D: options.D,
      },
    });
  }

  return out.sort((a, b) => a.day - b.day);
}

async function getConfig(guildId: string): Promise<ChallengeConfigRow | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('discord_exam_challenge_config')
    .select('*')
    .eq('guild_id', guildId)
    .maybeSingle<ChallengeConfigRow>();

  if (error) {
    maybeLogMissingTable(error);
    return null;
  }
  return data ?? null;
}

async function ensureConfig(guildId: string): Promise<ChallengeConfigRow | null> {
  const existing = await getConfig(guildId);
  if (existing) return existing;

  const supabase = getSupabase();
  const createdAt = nowIso();
  const payload: ChallengeConfigRow = {
    guild_id: guildId,
    status: 'draft',
    start_at: null,
    challenge_days: 20,
    question_xp: 500,
    invite_points: 10,
    channel_9ano_id: config.challenge9ChannelId || null,
    channel_12ano_id: config.challenge12ChannelId || null,
    leaderboard_channel_id: config.challengeLeaderboardChannelId || null,
    leaderboard_message_id: null,
    updated_at: createdAt,
  };

  const { data, error } = await supabase
    .from('discord_exam_challenge_config')
    .upsert(payload, { onConflict: 'guild_id' })
    .select('*')
    .single<ChallengeConfigRow>();

  if (error) {
    maybeLogMissingTable(error);
    return null;
  }
  return data;
}

async function saveConfigPatch(
  guildId: string,
  patch: Partial<ChallengeConfigRow>,
): Promise<ChallengeConfigRow | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('discord_exam_challenge_config')
    .upsert(
      {
        guild_id: guildId,
        ...patch,
        updated_at: nowIso(),
      },
      { onConflict: 'guild_id' },
    )
    .select('*')
    .single<ChallengeConfigRow>();

  if (error) {
    maybeLogMissingTable(error);
    return null;
  }
  return data;
}

function buildQuestionEmbed(params: {
  schoolYear: SchoolYear;
  day: number;
  question: ChallengeQuestionRow;
  closesAt: Date;
  imageFileName?: string;
}) {
  const closeDay = params.closesAt.toLocaleDateString('pt-PT');
  const embed = new EmbedBuilder()
    .setColor(0xffffff)
    .setTitle(`📘 Desafio Exame Nacional ${YEAR_LABEL[params.schoolYear]} | Dia ${params.day}`)
    .setDescription(clampText(params.question.prompt, 3500))
    .addFields(
      { name: 'A', value: clampText(params.question.option_a, 1024), inline: false },
      { name: 'B', value: clampText(params.question.option_b, 1024), inline: false },
      { name: 'C', value: clampText(params.question.option_c, 1024), inline: false },
      { name: 'D', value: clampText(params.question.option_d, 1024), inline: false },
    )
    .addFields({ name: '\u200b', value: `Respostas fecham às 19:00 do dia ${closeDay}` })
    .setFooter({ text: 'MatemáticaTop © 2026 | matematica.top' });

  if (params.imageFileName) {
    embed.setImage(`attachment://${params.imageFileName}`);
  }

  return embed;
}

export function buildChallengeInfoEmbed() {
  return new EmbedBuilder()
    .setColor(0xffffff)
    .setTitle('📢 Desafio Exame Nacional — MatemáticaTop')
    .setDescription(
      'Este desafio foi criado para te motivar e ajudar a preparar o Exame Nacional.\n\n' +
        '📅 **A partir do dia 1 de maio, durante 20 dias, todos os dias às 19:00, será publicada 1 pergunta de escolha múltipla** ' +
        '(uma de 9.º ano e outra de 12.º ano).\n\n' +
        '🏅 **Pontuação:**\n' +
        '• +500 XP por cada resposta certa\n' +
        '• +25 pontos por cada convite válido (desempate)\n\n' +
        '⚠️ **Regras importantes:**\n' +
        '• Cada utilizador só pode participar num percurso: 9.º ou 12.º ano\n' +
        '• Em caso de empate no XP, contam os pontos de convites\n' +
        '• Os prémios serão atribuídos aos 3 primeiros classificados (independentemente do ano)\n' +
        '• Em caso de fraude, por exemplo, através da utilização de bots para obter mais pontos de convite, o utilizador será desqualificado do desafio.\n\n' +
        '🎁 **Prémios:**\n' +
        '• 1.º lugar: 20€ + recompensa surpresa\n' +
        '• 2.º lugar: 10€\n' +
        '• 3.º lugar: 5€\n\n' +
        '🔗 **Convites:**\n' +
        'Cria o teu convite no Discord e partilha. O bot identifica automaticamente quem entrou por cada link e atualiza os pontos.\n\n' +
        '📌 **Comandos úteis:**\n' +
        '• `/desafio_ranking`\n' +
        '• `/desafio_estado`\n\n' +
        '💳 **Pagamento**\n' +
        'O pagamento será realizado através do MB Way, de criptomoeda ou outro método que for mais conveniente.',
    )
    .setFooter({ text: 'MatemáticaTop © 2026 | matematica.top' });
}

function buildAnswerButtons(schoolYear: SchoolYear, day: number) {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`${ANSWER_CUSTOM_ID_PREFIX}:${schoolYear}:${day}:A`)
      .setLabel('A')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`${ANSWER_CUSTOM_ID_PREFIX}:${schoolYear}:${day}:B`)
      .setLabel('B')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`${ANSWER_CUSTOM_ID_PREFIX}:${schoolYear}:${day}:C`)
      .setLabel('C')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`${ANSWER_CUSTOM_ID_PREFIX}:${schoolYear}:${day}:D`)
      .setLabel('D')
      .setStyle(ButtonStyle.Secondary),
  );
}

async function getRound(
  guildId: string,
  schoolYear: SchoolYear,
  day: number,
): Promise<ChallengeRoundRow | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('discord_exam_challenge_rounds')
    .select('*')
    .eq('guild_id', guildId)
    .eq('school_year', schoolYear)
    .eq('day_index', day)
    .maybeSingle<ChallengeRoundRow>();

  if (error) {
    maybeLogMissingTable(error);
    return null;
  }
  return data ?? null;
}

async function getQuestion(
  guildId: string,
  schoolYear: SchoolYear,
  day: number,
): Promise<ChallengeQuestionRow | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('discord_exam_challenge_questions')
    .select('*')
    .eq('guild_id', guildId)
    .eq('school_year', schoolYear)
    .eq('day_index', day)
    .maybeSingle<ChallengeQuestionRow>();

  if (error) {
    maybeLogMissingTable(error);
    return null;
  }
  return data ?? null;
}

async function ensureParticipant(guildId: string, userId: string): Promise<ChallengeParticipantRow | null> {
  const supabase = getSupabase();
  const { data: existing, error: readError } = await supabase
    .from('discord_exam_challenge_participants')
    .select('*')
    .eq('guild_id', guildId)
    .eq('discord_user_id', userId)
    .maybeSingle<ChallengeParticipantRow>();
  if (readError) {
    maybeLogMissingTable(readError);
    return null;
  }

  if (existing) return existing;

  const now = nowIso();
  const { data: created, error: createError } = await supabase
    .from('discord_exam_challenge_participants')
    .insert({
      guild_id: guildId,
      discord_user_id: userId,
      locked_year: null,
      question_xp: 0,
      invite_points: 0,
      active_invites: 0,
      answers_count: 0,
      correct_answers: 0,
      updated_at: now,
    })
    .select('*')
    .single<ChallengeParticipantRow>();

  if (createError) {
    maybeLogMissingTable(createError);
    return null;
  }
  return created;
}

async function applyInviteDelta(
  guildId: string,
  inviterId: string,
  pointsDelta: number,
  activeInvitesDelta: number,
) {
  const participant = await ensureParticipant(guildId, inviterId);
  if (!participant) return;

  const nextInvitePoints = Math.max(0, participant.invite_points + pointsDelta);
  const nextActiveInvites = Math.max(0, participant.active_invites + activeInvitesDelta);
  const supabase = getSupabase();
  const { error } = await supabase
    .from('discord_exam_challenge_participants')
    .update({
      invite_points: nextInvitePoints,
      active_invites: nextActiveInvites,
      updated_at: nowIso(),
    })
    .eq('guild_id', guildId)
    .eq('discord_user_id', inviterId);
  if (error) {
    maybeLogMissingTable(error);
  }
}

async function updateLeaderboard(guildId: string, force = false) {
  const client = runtimeClient;
  if (!client) return;

  const now = Date.now();
  const lastAt = lastLeaderboardRefreshAt.get(guildId) || 0;
  if (!force && now - lastAt < LEADERBOARD_REFRESH_MIN_MS) return;
  lastLeaderboardRefreshAt.set(guildId, now);

  const cfg = await getConfig(guildId);
  if (!cfg?.leaderboard_channel_id) return;

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('discord_exam_challenge_participants')
    .select('*')
    .eq('guild_id', guildId)
    .order('question_xp', { ascending: false })
    .order('invite_points', { ascending: false })
    .order('updated_at', { ascending: true })
    .limit(300);

  if (error) {
    maybeLogMissingTable(error);
    return;
  }

  const participants = (data || []) as ChallengeParticipantRow[];

  function linesForYear(year: SchoolYear) {
    const filtered = participants
      .filter((row) => row.locked_year === year)
      .sort((a, b) => {
        if (b.question_xp !== a.question_xp) return b.question_xp - a.question_xp;
        if (b.invite_points !== a.invite_points) return b.invite_points - a.invite_points;
        return a.updated_at.localeCompare(b.updated_at);
      })
      .slice(0, 10);

    if (filtered.length === 0) return '_Sem pontuações ainda._';
    return filtered
      .map(
        (row, idx) =>
          `**${idx + 1}.** <@${row.discord_user_id}> · XP: **${row.question_xp}** · Pontos: **${row.invite_points}**`,
      )
      .join('\n');
  }

  const embed = new EmbedBuilder()
    .setColor(0xffffff)
    .setTitle('🏆 Ranking do Desafio')
    .setDescription(
      'Esta é o ranking do desafio com base no XP obtido nas perguntas e nos pontos obtidos através dos convites.',
    )
    .addFields(
      { name: '9.º Ano', value: linesForYear('9ano'), inline: false },
      { name: '12.º Ano', value: linesForYear('12ano'), inline: false },
    )
    .setFooter({ text: 'Atualizado automaticamente' })
    .setTimestamp(new Date());

  const channel = await client.channels.fetch(cfg.leaderboard_channel_id).catch(() => null);
  if (!channel || !channel.isTextBased() || !('messages' in channel) || !('send' in channel)) return;

  if (cfg.leaderboard_message_id) {
    const existing = await channel.messages.fetch(cfg.leaderboard_message_id).catch(() => null);
    if (existing) {
      await existing.edit({ embeds: [embed] }).catch(() => null);
      return;
    }
  }

  const sent = await channel.send({ embeds: [embed] }).catch(() => null);
  if (!sent) return;
  await saveConfigPatch(guildId, { leaderboard_message_id: sent.id });
}

async function publishRoundIfNeeded(
  guild: Guild,
  cfg: ChallengeConfigRow,
  schoolYear: SchoolYear,
  day: number,
  opensAt: Date,
) {
  const existingRound = await getRound(guild.id, schoolYear, day);
  if (existingRound) return;

  const channelId = schoolYear === '9ano' ? cfg.channel_9ano_id : cfg.channel_12ano_id;
  if (!channelId) return;

  const question = await getQuestion(guild.id, schoolYear, day);
  const correctOption = question?.correct_option || getAnswerKeyOptionForDay(schoolYear, day);
  if (!question || !correctOption) {
    console.log(
      `[Desafio] Pergunta em falta ou sem resposta correta: guild=${guild.id} ano=${schoolYear} dia=${day}`,
    );
    return;
  }

  const channel = await guild.channels.fetch(channelId).catch(() => null);
  if (!channel || !channel.isTextBased() || !('send' in channel)) return;

  const closesAt = new Date(opensAt.getTime() + DAY_MS);
  const imagePath = getImagePathForChallengeDay(schoolYear, day);
  const imageFileName = imagePath ? path.basename(imagePath) : undefined;
  const embed = buildQuestionEmbed({
    schoolYear,
    day,
    question,
    closesAt,
    imageFileName,
  });
  const row = buildAnswerButtons(schoolYear, day);
  const message = await channel
    .send({
      embeds: [embed],
      components: [row],
      files: imagePath && imageFileName ? [{ attachment: imagePath, name: imageFileName }] : undefined,
    })
    .catch(() => null);
  if (!message) return;

  const supabase = getSupabase();
  const { error } = await supabase.from('discord_exam_challenge_rounds').insert({
    guild_id: guild.id,
    school_year: schoolYear,
    day_index: day,
    channel_id: channel.id,
    message_id: message.id,
    opens_at: opensAt.toISOString(),
    closes_at: closesAt.toISOString(),
    status: 'open',
    posted_at: nowIso(),
  });
  if (error) {
    maybeLogMissingTable(error);
  }
}

async function closeExpiredRounds(guildId: string) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('discord_exam_challenge_rounds')
    .update({ status: 'closed' })
    .eq('guild_id', guildId)
    .eq('status', 'open')
    .lte('closes_at', nowIso());
  if (error) {
    maybeLogMissingTable(error);
  }
}

async function runChallengeSchedulerTick(client: Client) {
  const guild = await client.guilds.fetch(config.guildId).catch(() => null);
  if (!guild) return;

  const cfg = await ensureConfig(guild.id);
  if (!cfg) return;

  if (cfg.status === 'scheduled' && cfg.start_at) {
    const startAt = new Date(cfg.start_at).getTime();
    if (!Number.isNaN(startAt) && Date.now() >= startAt) {
      const updated = await saveConfigPatch(guild.id, { status: 'running' });
      if (updated) {
        await guild.systemChannel
          ?.send('🚀 O desafio começou automaticamente! Boa sorte a todos.')
          .catch(() => null);
      }
    }
  }

  const freshConfig = (await getConfig(guild.id)) || cfg;
  if (freshConfig.status !== 'running' || !freshConfig.start_at) {
    await updateLeaderboard(guild.id, false);
    return;
  }

  const startAt = new Date(freshConfig.start_at);
  if (Number.isNaN(startAt.getTime())) return;

  const elapsed = Date.now() - startAt.getTime();
  const dayIndex = Math.floor(elapsed / DAY_MS) + 1;

  await closeExpiredRounds(guild.id);

  if (dayIndex > freshConfig.challenge_days) {
    await saveConfigPatch(guild.id, { status: 'completed' });
    await updateLeaderboard(guild.id, true);
    return;
  }

  const todayStart = new Date(startAt.getTime() + (dayIndex - 1) * DAY_MS);
  if (Date.now() >= todayStart.getTime()) {
    await publishRoundIfNeeded(guild, freshConfig, '9ano', dayIndex, todayStart);
    await publishRoundIfNeeded(guild, freshConfig, '12ano', dayIndex, todayStart);
  }

  await updateLeaderboard(guild.id, false);
}

async function updateInviteCacheForGuild(guild: Guild) {
  const invites = await guild.invites.fetch().catch(() => null);
  if (!invites) return;
  const usesByCode = new Map<string, number>();
  invites.forEach((invite) => {
    if (invite.code) {
      usesByCode.set(invite.code, invite.uses ?? 0);
    }
  });
  inviteUsesCache.set(guild.id, usesByCode);
}

async function detectUsedInvite(guild: Guild): Promise<{ code: string; inviterId: string } | null> {
  const previous = inviteUsesCache.get(guild.id) || new Map<string, number>();
  const currentInvites = await guild.invites.fetch().catch(() => null);
  if (!currentInvites) return null;

  let detected: { code: string; inviterId: string } | null = null;
  const nextCache = new Map<string, number>();
  currentInvites.forEach((invite) => {
    const uses = invite.uses ?? 0;
    nextCache.set(invite.code, uses);
    const before = previous.get(invite.code) ?? 0;
    if (uses > before && invite.inviter?.id) {
      detected = { code: invite.code, inviterId: invite.inviter.id };
    }
  });
  inviteUsesCache.set(guild.id, nextCache);
  return detected;
}

export async function handleChallengeMemberJoin(member: GuildMember) {
  const cfg = await getConfig(member.guild.id);
  if (!cfg) {
    await updateInviteCacheForGuild(member.guild);
    return;
  }

  const detected = await detectUsedInvite(member.guild);
  if (!detected) return;
  if (detected.inviterId === member.id) return;

  const supabase = getSupabase();
  const { data: existing, error: readError } = await supabase
    .from('discord_exam_challenge_invites')
    .select('*')
    .eq('guild_id', member.guild.id)
    .eq('invited_user_id', member.id)
    .maybeSingle<InviteAttributionRow>();
  if (readError) {
    maybeLogMissingTable(readError);
    return;
  }

  const isRunning = cfg.status === 'running';
  const shouldApplyPoints = isRunning;
  const shouldAddPoints =
    shouldApplyPoints && (!existing || !existing.is_active || !existing.points_applied);

  const { error: upsertError } = await supabase.from('discord_exam_challenge_invites').upsert(
    {
      guild_id: member.guild.id,
      invited_user_id: member.id,
      inviter_user_id: detected.inviterId,
      invite_code: detected.code,
      joined_at: nowIso(),
      left_at: null,
      is_active: true,
      points_applied: shouldApplyPoints,
    },
    { onConflict: 'guild_id,invited_user_id' },
  );
  if (upsertError) {
    maybeLogMissingTable(upsertError);
    return;
  }

  if (shouldAddPoints) {
    await applyInviteDelta(member.guild.id, detected.inviterId, cfg.invite_points, 1);
    await updateLeaderboard(member.guild.id, true);
  }
}

export async function handleChallengeMemberLeave(member: GuildMember | PartialGuildMember) {
  const supabase = getSupabase();
  const { data: row, error } = await supabase
    .from('discord_exam_challenge_invites')
    .select('*')
    .eq('guild_id', member.guild.id)
    .eq('invited_user_id', member.id)
    .maybeSingle<InviteAttributionRow>();
  if (error) {
    maybeLogMissingTable(error);
    return;
  }
  if (!row || !row.is_active) return;

  const cfg = await getConfig(member.guild.id);
  const invitePoints = cfg?.invite_points ?? 10;

  const { error: updateError } = await supabase
    .from('discord_exam_challenge_invites')
    .update({ is_active: false, left_at: nowIso() })
    .eq('guild_id', member.guild.id)
    .eq('invited_user_id', member.id);
  if (updateError) {
    maybeLogMissingTable(updateError);
    return;
  }

  if (row.points_applied) {
    await applyInviteDelta(member.guild.id, row.inviter_user_id, -invitePoints, -1);
    await updateLeaderboard(member.guild.id, true);
  }
}

export async function handleChallengeAnswerButton(interaction: ButtonInteraction) {
  const parts = interaction.customId.split(':');
  if (parts.length !== 4 || parts[0] !== ANSWER_CUSTOM_ID_PREFIX) return;

  const schoolYear = assertSchoolYear(parts[1]);
  const day = Number.parseInt(parts[2], 10);
  const selected = toOption(parts[3]);
  if (!schoolYear || !Number.isFinite(day) || !selected || !interaction.guildId) {
    await interaction.reply({
      content: 'Resposta inválida.',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const cfg = await getConfig(interaction.guildId);
  if (!cfg || cfg.status !== 'running') {
    await interaction.reply({
      content: 'O desafio não está ativo neste momento.',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const round = await getRound(interaction.guildId, schoolYear, day);
  if (!round || round.status !== 'open') {
    await interaction.reply({
      content: 'Esta pergunta já está fechada.',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  if (new Date(round.closes_at).getTime() <= Date.now()) {
    await interaction.reply({
      content: 'A janela de resposta desta pergunta já terminou.',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const participant = await ensureParticipant(interaction.guildId, interaction.user.id);
  if (!participant) {
    await interaction.reply({
      content: 'Não foi possível registar a resposta agora.',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  if (participant.locked_year && participant.locked_year !== schoolYear) {
    await interaction.reply({
      content: `Ficaste associado ao percurso **${YEAR_LABEL[participant.locked_year]}**. Não podes responder ao outro ano.`,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const supabase = getSupabase();
  const { data: existingAnswer, error: readAnswerError } = await supabase
    .from('discord_exam_challenge_answers')
    .select('id')
    .eq('guild_id', interaction.guildId)
    .eq('school_year', schoolYear)
    .eq('day_index', day)
    .eq('discord_user_id', interaction.user.id)
    .maybeSingle<{ id: string }>();
  if (readAnswerError) {
    maybeLogMissingTable(readAnswerError);
    await interaction.reply({
      content: 'Não foi possível validar a tua resposta agora.',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  if (existingAnswer) {
    await interaction.reply({
      content: 'Já respondeste a esta pergunta.',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const question = await getQuestion(interaction.guildId, schoolYear, day);
  const correctOption = question?.correct_option || getAnswerKeyOptionForDay(schoolYear, day);
  if (!question || !correctOption) {
    await interaction.reply({
      content: 'Esta pergunta ainda não tem gabarito configurado.',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const isCorrect = selected === correctOption;
  const answerInsert = {
    guild_id: interaction.guildId,
    school_year: schoolYear,
    day_index: day,
    discord_user_id: interaction.user.id,
    selected_option: selected,
    is_correct: isCorrect,
    answered_at: nowIso(),
  };

  const { error: insertAnswerError } = await supabase
    .from('discord_exam_challenge_answers')
    .insert(answerInsert);
  if (insertAnswerError) {
    maybeLogMissingTable(insertAnswerError);
    await interaction.reply({
      content: 'Não foi possível registar a tua resposta agora.',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const questionGain = isCorrect ? cfg.question_xp : 0;
  const nextQuestionXp = participant.question_xp + questionGain;
  const nextAnswers = participant.answers_count + 1;
  const nextCorrect = participant.correct_answers + (isCorrect ? 1 : 0);

  const { error: updateParticipantError } = await supabase
    .from('discord_exam_challenge_participants')
    .update({
      locked_year: participant.locked_year || schoolYear,
      question_xp: nextQuestionXp,
      answers_count: nextAnswers,
      correct_answers: nextCorrect,
      updated_at: nowIso(),
    })
    .eq('guild_id', interaction.guildId)
    .eq('discord_user_id', interaction.user.id);
  if (updateParticipantError) {
    maybeLogMissingTable(updateParticipantError);
  }

  await updateLeaderboard(interaction.guildId, true);

  const content = isCorrect
    ? `✅ Parabéns! Acertaste e ganhaste ${cfg.question_xp} XP.`
    : `❌ Que pena, a resposta correta era a ${correctOption}. Não desmotives, amanhã acertas de certeza!`;

  await interaction.reply({
    content,
    flags: MessageFlags.Ephemeral,
  });
}

async function countQuestionStats(guildId: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('discord_exam_challenge_questions')
    .select('school_year, correct_option')
    .eq('guild_id', guildId);
  if (error) {
    maybeLogMissingTable(error);
    return {
      '9ano': { total: 0, withAnswer: 0 },
      '12ano': { total: 0, withAnswer: 0 },
    };
  }
  const rows = (data || []) as Array<{ school_year: SchoolYear; correct_option: AnswerOption | null }>;
  const stats: Record<SchoolYear, { total: number; withAnswer: number }> = {
    '9ano': { total: 0, withAnswer: 0 },
    '12ano': { total: 0, withAnswer: 0 },
  };
  for (const row of rows) {
    stats[row.school_year].total += 1;
    if (row.correct_option) stats[row.school_year].withAnswer += 1;
  }
  return stats;
}

export async function handleChallengeConfigureCommand(interaction: ChatInputCommandInteraction) {
  if (!interaction.guildId) {
    await interaction.reply({ content: 'Este comando só funciona no servidor.', flags: MessageFlags.Ephemeral });
    return;
  }
  if (!isAdmin(interaction)) {
    await interaction.reply({ content: 'Apenas administradores podem configurar o desafio.', flags: MessageFlags.Ephemeral });
    return;
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  const existing = await ensureConfig(interaction.guildId);
  if (!existing) {
    await interaction.editReply('Não foi possível carregar a configuração do desafio.');
    return;
  }

  const channel9 = interaction.options.getChannel('canal_9ano');
  const channel12 = interaction.options.getChannel('canal_12ano');
  const rankingChannel = interaction.options.getChannel('canal_ranking');
  const questionXp = interaction.options.getInteger('pontos_pergunta') ?? existing.question_xp;
  const invitePoints = interaction.options.getInteger('pontos_convite') ?? existing.invite_points;
  const challengeDays = interaction.options.getInteger('dias') ?? existing.challenge_days;

  const patched = await saveConfigPatch(interaction.guildId, {
    channel_9ano_id: channel9?.id || existing.channel_9ano_id,
    channel_12ano_id: channel12?.id || existing.channel_12ano_id,
    leaderboard_channel_id: rankingChannel?.id || existing.leaderboard_channel_id,
    question_xp: questionXp,
    invite_points: invitePoints,
    challenge_days: challengeDays,
  });
  if (!patched) {
    await interaction.editReply('Não foi possível guardar a configuração.');
    return;
  }

  await updateLeaderboard(interaction.guildId, true);

  await interaction.editReply(
    `✅ Configuração atualizada.\n` +
      `• Canal 9.º: ${patched.channel_9ano_id ? `<#${patched.channel_9ano_id}>` : '—'}\n` +
      `• Canal 12.º: ${patched.channel_12ano_id ? `<#${patched.channel_12ano_id}>` : '—'}\n` +
      `• Canal ranking: ${patched.leaderboard_channel_id ? `<#${patched.leaderboard_channel_id}>` : '—'}\n` +
      `• XP por acerto: **${patched.question_xp}**\n` +
      `• Pontos por convite válido: **${patched.invite_points}**\n` +
      `• Duração: **${patched.challenge_days} dias**`,
  );
}

export async function handleChallengeImportQuestionsCommand(interaction: ChatInputCommandInteraction) {
  if (!interaction.guildId) {
    await interaction.reply({ content: 'Este comando só funciona no servidor.', flags: MessageFlags.Ephemeral });
    return;
  }
  if (!isAdmin(interaction)) {
    await interaction.reply({ content: 'Apenas administradores podem importar perguntas.', flags: MessageFlags.Ephemeral });
    return;
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  const year = assertSchoolYear(interaction.options.getString('ano'));
  if (!year) {
    await interaction.editReply('Ano inválido.');
    return;
  }

  const filePath =
    interaction.options.getString('caminho') ||
    (year === '9ano' ? config.challengeQuestions9Path : config.challengeQuestions12Path);

  if (!filePath || !fs.existsSync(filePath)) {
    await interaction.editReply(`Ficheiro não encontrado: \`${filePath || '(vazio)'}\``);
    return;
  }

  const html = fs.readFileSync(filePath, 'utf-8');
  const imported = extractQuestionsFromHtml(html);
  if (imported.length === 0) {
    await interaction.editReply('Não consegui extrair perguntas desse HTML.');
    return;
  }

  const cfg = await ensureConfig(interaction.guildId);
  if (!cfg) {
    await interaction.editReply('Não foi possível carregar a configuração do desafio.');
    return;
  }

  const capped = imported.filter((q) => q.day >= 1 && q.day <= cfg.challenge_days);
  const now = nowIso();
  const rows = capped.map((question) => ({
    guild_id: interaction.guildId,
    school_year: year,
    day_index: question.day,
    prompt: question.prompt,
    option_a: question.options.A,
    option_b: question.options.B,
    option_c: question.options.C,
    option_d: question.options.D,
    updated_at: now,
  }));

  const supabase = getSupabase();
  const { error } = await supabase
    .from('discord_exam_challenge_questions')
    .upsert(rows, { onConflict: 'guild_id,school_year,day_index' });
  if (error) {
    maybeLogMissingTable(error);
    await interaction.editReply('Falha ao guardar perguntas no Supabase.');
    return;
  }

  await interaction.editReply(
    `✅ Importadas **${rows.length}** perguntas para **${YEAR_LABEL[year]}** a partir de \`${filePath}\`.\n` +
      'Agora define o gabarito com `/desafio_definir_gabarito`.',
  );
}

export async function handleChallengeSetAnswerKeyCommand(interaction: ChatInputCommandInteraction) {
  if (!interaction.guildId) {
    await interaction.reply({ content: 'Este comando só funciona no servidor.', flags: MessageFlags.Ephemeral });
    return;
  }
  if (!isAdmin(interaction)) {
    await interaction.reply({ content: 'Apenas administradores podem definir gabarito.', flags: MessageFlags.Ephemeral });
    return;
  }
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const year = assertSchoolYear(interaction.options.getString('ano'));
  const keyRaw = interaction.options.getString('gabarito') || '';
  if (!year) {
    await interaction.editReply('Ano inválido.');
    return;
  }

  const letters = keyRaw.toUpperCase().replace(/[^ABCD]/g, '').split('');
  if (letters.length === 0) {
    await interaction.editReply('Gabarito inválido. Usa apenas letras A/B/C/D.');
    return;
  }

  const updates = letters.map((letter, idx) => ({
    guild_id: interaction.guildId,
    school_year: year,
    day_index: idx + 1,
    correct_option: letter,
    updated_at: nowIso(),
  }));

  const supabase = getSupabase();
  const { error } = await supabase
    .from('discord_exam_challenge_questions')
    .upsert(updates, { onConflict: 'guild_id,school_year,day_index' });
  if (error) {
    maybeLogMissingTable(error);
    await interaction.editReply('Falha ao guardar gabarito no Supabase.');
    return;
  }

  await interaction.editReply(
    `✅ Gabarito atualizado para **${YEAR_LABEL[year]}** em **${letters.length}** dias.`,
  );
}

export async function handleChallengeScheduleCommand(interaction: ChatInputCommandInteraction) {
  if (!interaction.guildId) {
    await interaction.reply({ content: 'Este comando só funciona no servidor.', flags: MessageFlags.Ephemeral });
    return;
  }
  if (!isAdmin(interaction)) {
    await interaction.reply({ content: 'Apenas administradores podem agendar o desafio.', flags: MessageFlags.Ephemeral });
    return;
  }
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const date = interaction.options.getString('data') || '';
  const hour = interaction.options.getInteger('hora');
  const minute = interaction.options.getInteger('minuto');
  if (hour === null || minute === null) {
    await interaction.editReply('Hora/minuto inválidos.');
    return;
  }

  const parsed = parseScheduleDate(date, hour, minute);
  if (!parsed) {
    await interaction.editReply('Data inválida. Usa o formato `YYYY-MM-DD`.');
    return;
  }

  const updated = await saveConfigPatch(interaction.guildId, {
    start_at: parsed.toISOString(),
    status: 'scheduled',
    leaderboard_message_id: null,
  });
  if (!updated) {
    await interaction.editReply('Não foi possível agendar o desafio.');
    return;
  }

  await interaction.editReply(
    `✅ Desafio agendado para **${parsed.toLocaleString('pt-PT')}**.\n` +
      'Não começa antes dessa data/hora.',
  );
}

export async function handleChallengeStartNowCommand(interaction: ChatInputCommandInteraction) {
  if (!interaction.guildId) {
    await interaction.reply({ content: 'Este comando só funciona no servidor.', flags: MessageFlags.Ephemeral });
    return;
  }
  if (!isAdmin(interaction)) {
    await interaction.reply({ content: 'Apenas administradores podem iniciar o desafio.', flags: MessageFlags.Ephemeral });
    return;
  }
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const updated = await saveConfigPatch(interaction.guildId, {
    start_at: nowIso(),
    status: 'running',
    leaderboard_message_id: null,
  });
  if (!updated) {
    await interaction.editReply('Não foi possível iniciar o desafio agora.');
    return;
  }

  await runChallengeSchedulerTick(interaction.client);
  await interaction.editReply('✅ Desafio iniciado agora.');
}

export async function handleChallengePauseCommand(interaction: ChatInputCommandInteraction) {
  if (!interaction.guildId) {
    await interaction.reply({ content: 'Este comando só funciona no servidor.', flags: MessageFlags.Ephemeral });
    return;
  }
  if (!isAdmin(interaction)) {
    await interaction.reply({ content: 'Apenas administradores podem pausar o desafio.', flags: MessageFlags.Ephemeral });
    return;
  }
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const updated = await saveConfigPatch(interaction.guildId, {
    status: 'paused',
  });
  if (!updated) {
    await interaction.editReply('Não foi possível pausar o desafio.');
    return;
  }

  await interaction.editReply('⏸️ Desafio pausado.');
}

export async function handleChallengeStateCommand(interaction: ChatInputCommandInteraction) {
  if (!interaction.guildId) {
    await interaction.reply({ content: 'Este comando só funciona no servidor.', flags: MessageFlags.Ephemeral });
    return;
  }
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const cfg = await ensureConfig(interaction.guildId);
  if (!cfg) {
    await interaction.editReply('Não foi possível carregar o estado do desafio.');
    return;
  }

  const embed = new EmbedBuilder()
    .setColor(0xffffff)
    .setTitle('📌 Estado do desafio')
    .addFields(
      { name: 'Início', value: cfg.start_at ? `<t:${Math.floor(new Date(cfg.start_at).getTime() / 1000)}:f>` : '—', inline: true },
      { name: 'Duração', value: `**${cfg.challenge_days} dias**`, inline: true },
      { name: '\u200b', value: '\u200b', inline: true },
      { name: 'Canal 9.º', value: cfg.channel_9ano_id ? `<#${cfg.channel_9ano_id}>` : '—', inline: true },
      { name: 'Canal 12.º', value: cfg.channel_12ano_id ? `<#${cfg.channel_12ano_id}>` : '—', inline: true },
      { name: 'Canal ranking', value: cfg.leaderboard_channel_id ? `<#${cfg.leaderboard_channel_id}>` : '—', inline: true },
      { name: 'Canal info', value: `<#${CHALLENGE_INFO_CHANNEL_ID}>`, inline: true },
      { name: 'Pontuação', value: `Acerto: **${cfg.question_xp}** · Convite válido: **${cfg.invite_points}**`, inline: true },
      { name: '\u200b', value: '\u200b', inline: true },
    );

  await interaction.editReply({ embeds: [embed] });
}

export async function handleChallengeRankingCommand(interaction: ChatInputCommandInteraction) {
  if (!interaction.guildId) {
    await interaction.reply({ content: 'Este comando só funciona no servidor.', flags: MessageFlags.Ephemeral });
    return;
  }
  await interaction.deferReply();

  const yearFilter = interaction.options.getString('ano') || 'todos';
  const limit = interaction.options.getInteger('limite') || 10;
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('discord_exam_challenge_participants')
    .select('*')
    .eq('guild_id', interaction.guildId)
    .order('question_xp', { ascending: false })
    .order('invite_points', { ascending: false })
    .order('updated_at', { ascending: true })
    .limit(300);
  if (error) {
    maybeLogMissingTable(error);
    await interaction.editReply('Não foi possível carregar o ranking do desafio.');
    return;
  }
  const rows = (data || []) as ChallengeParticipantRow[];

  function linesForYear(year: SchoolYear) {
    const filtered = rows
      .filter((row) => row.locked_year === year)
      .sort((a, b) => {
        if (b.question_xp !== a.question_xp) return b.question_xp - a.question_xp;
        if (b.invite_points !== a.invite_points) return b.invite_points - a.invite_points;
        return a.updated_at.localeCompare(b.updated_at);
      })
      .slice(0, limit);
    if (filtered.length === 0) return '_Sem pontuação ainda._';
    return filtered
      .map(
        (row, idx) =>
          `**${idx + 1}.** <@${row.discord_user_id}> · XP: **${row.question_xp}** · Pontos: **${row.invite_points}**`,
      )
      .join('\n');
  }

  const embed = new EmbedBuilder().setColor(0xffffff).setTitle('🏆 Ranking do Desafio');
  if (yearFilter === '9ano') {
    embed.addFields({ name: YEAR_LABEL['9ano'], value: linesForYear('9ano') });
  } else if (yearFilter === '12ano') {
    embed.addFields({ name: YEAR_LABEL['12ano'], value: linesForYear('12ano') });
  } else {
    embed.addFields(
      { name: YEAR_LABEL['9ano'], value: linesForYear('9ano') },
      { name: YEAR_LABEL['12ano'], value: linesForYear('12ano') },
    );
  }

  await interaction.editReply({ embeds: [embed] });
}

export async function bootstrapChallengeSystem(client: Client) {
  runtimeClient = client;
  const guild = await client.guilds.fetch(config.guildId).catch(() => null);
  if (!guild) return;
  await ensureConfig(guild.id);
  await updateInviteCacheForGuild(guild);
  await runChallengeSchedulerTick(client);

  if (!schedulerHandle) {
    schedulerHandle = setInterval(() => {
      runChallengeSchedulerTick(client).catch((error) => {
        console.error('Erro no scheduler do desafio:', error);
      });
    }, SCHEDULER_INTERVAL_MS);
  }
}
