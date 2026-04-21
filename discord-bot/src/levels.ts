import { AttachmentBuilder, Guild, Message, ThreadChannel, User } from 'discord.js';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import path from 'path';
import fs from 'fs';
import { config } from './config';
import { getSupabase } from './database';

export type ProgressTrack = 'helper' | 'student';

type RoleTier = {
  minLevel: number;
  roleName: string;
};

type ProgressRow = {
  guild_id: string;
  discord_user_id: string;
  track: ProgressTrack;
  xp: number;
  level: number;
  last_xp_at: string | null;
};

const XP_PER_HELPER_REPLY = 10;
const XP_PER_STUDENT_THREAD = 30;
const HELPER_COOLDOWN_MS = 60 * 1000;
const STUDENT_COOLDOWN_MS = 30 * 60 * 1000;
const XP_DM_PROBABILITY = 0.35;
const LEVEL_XP_FACTOR = 40;
const LEVEL_UP_TEMPLATE_PATH = path.join(process.cwd(), 'assets', 'level-up-card-template.png');
const AVATAR_CENTER_X = 251;
const AVATAR_CENTER_Y = 387;
const AVATAR_RADIUS = 192;
const USERNAME_TEXT_X = 540;
const USERNAME_TEXT_Y = 328;
const LEVEL_TEXT_X = 540;
const LEVEL_TEXT_Y = 643;

const HELPER_ROLE_TIERS: RoleTier[] = [
  { minLevel: 2, roleName: 'Ajudante' },
  { minLevel: 4, roleName: 'Esclarecedor' },
  { minLevel: 6, roleName: 'Mentor' },
  { minLevel: 8, roleName: 'Professor' },
  { minLevel: 10, roleName: 'Professor Elite' },
];

const STUDENT_ROLE_TIERS: RoleTier[] = [
  { minLevel: 2, roleName: 'Dedicado' },
  { minLevel: 4, roleName: 'Estudioso' },
  { minLevel: 6, roleName: 'Persistente' },
  { minLevel: 8, roleName: 'Focado' },
  { minLevel: 10, roleName: 'Exemplar' },
];

let hasLoggedMissingTable = false;

function getTrackRoleTiers(track: ProgressTrack): RoleTier[] {
  return track === 'helper' ? HELPER_ROLE_TIERS : STUDENT_ROLE_TIERS;
}

export function getTrackLabel(track: ProgressTrack): string {
  return track === 'helper' ? 'Ajudante' : 'Estudante';
}

export function getRoleForLevel(track: ProgressTrack, level: number): string | null {
  const tiers = getTrackRoleTiers(track);
  let matched: string | null = null;
  for (const tier of tiers) {
    if (level >= tier.minLevel) {
      matched = tier.roleName;
    }
  }
  return matched;
}

export function getMinXpForLevel(level: number): number {
  const safeLevel = Math.max(1, level);
  return (safeLevel - 1) * (safeLevel - 1) * LEVEL_XP_FACTOR;
}

export function calculateLevelFromXp(xp: number): number {
  return Math.max(1, Math.floor(Math.sqrt(xp / LEVEL_XP_FACTOR)) + 1);
}

function isMissingTableError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const message = String((error as { message?: string }).message || '').toLowerCase();
  return message.includes('discord_level_progress') && message.includes('does not exist');
}

function logMissingTableWarningOnce() {
  if (hasLoggedMissingTable) return;
  hasLoggedMissingTable = true;
  console.log(
    'Tabela discord_level_progress não encontrada. Atualiza e executa o discord-bot/schema.sql no Supabase.',
  );
}

async function resolveThreadOwnerId(thread: ThreadChannel<boolean>): Promise<string | null> {
  if (thread.ownerId) return thread.ownerId;
  try {
    const owner = await thread.fetchOwner();
    return owner?.id || null;
  } catch {
    return null;
  }
}

async function ensureRoleByName(guild: Guild, roleName: string): Promise<string | null> {
  const lowerName = roleName.toLowerCase();
  let role = guild.roles.cache.find((item) => item.name.toLowerCase() === lowerName) || null;

  if (!role) {
    const fetched = await guild.roles.fetch();
    role = fetched.find((item) => item?.name.toLowerCase() === lowerName) || null;
  }

  if (role) return role.id;

  try {
    const created = await guild.roles.create({
      name: roleName,
      reason: 'Sistema de níveis automático',
      mentionable: false,
      hoist: false,
    });
    return created.id;
  } catch (error) {
    console.error(`Falha ao criar cargo "${roleName}":`, error);
    return null;
  }
}

async function syncTrackRole(
  guild: Guild,
  userId: string,
  track: ProgressTrack,
  level: number,
): Promise<string | null> {
  const member = await guild.members.fetch(userId).catch(() => null);
  if (!member) return null;

  const tiers = getTrackRoleTiers(track);
  const tierNames = tiers.map((item) => item.roleName.toLowerCase());
  const targetRoleName = getRoleForLevel(track, level);

  const existingTrackRoleIds = member.roles.cache
    .filter((role) => tierNames.includes(role.name.toLowerCase()))
    .map((role) => role.id);

  if (!targetRoleName) {
    if (existingTrackRoleIds.length > 0) {
      await member.roles.remove(existingTrackRoleIds, 'Reset de cargo por nível');
    }
    return null;
  }

  const targetRoleId = await ensureRoleByName(guild, targetRoleName);
  if (!targetRoleId) return null;

  const removableRoleIds = existingTrackRoleIds.filter((roleId) => roleId !== targetRoleId);
  if (removableRoleIds.length > 0) {
    await member.roles.remove(removableRoleIds, 'Atualização de cargo por nível');
  }

  if (!member.roles.cache.has(targetRoleId)) {
    await member.roles.add(targetRoleId, 'Atualização de cargo por nível');
  }

  return targetRoleName;
}

async function maybeSendXpDm(options: {
  user?: User;
  guild: Guild;
  userId: string;
  track: ProgressTrack;
  xpGain: number;
  totalXp: number;
  level: number;
  leveledUp: boolean;
  roleName: string | null;
}) {
  const shouldNotify = options.leveledUp || Math.random() < XP_DM_PROBABILITY;
  if (!shouldNotify) return;

  const user = options.user || (await options.guild.client.users.fetch(options.userId).catch(() => null));
  if (!user) return;

  const lines = [
    `✨ Ganhaste **${options.xpGain} XP** no percurso **${getTrackLabel(options.track)}**!`,
    `Nível atual: **${options.level}** (**${options.totalXp} XP**).`,
  ];

  if (options.leveledUp) {
    lines.push('⬆️ Subiste de nível!');
  }
  if (options.roleName) {
    lines.push(`🏅 Cargo atual: **${options.roleName}**.`);
  }

  await user.send(lines.join('\n')).catch(() => null);
}

function fitUsername(username: string): string {
  if (username.length <= 20) return username;
  return `${username.slice(0, 19)}…`;
}

async function buildLevelUpCard(user: User, level: number): Promise<Buffer> {
  if (!fs.existsSync(LEVEL_UP_TEMPLATE_PATH)) {
    throw new Error(`Template de level-up não encontrado em ${LEVEL_UP_TEMPLATE_PATH}`);
  }

  const template = await loadImage(LEVEL_UP_TEMPLATE_PATH);
  const canvas = createCanvas(template.width, template.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(template, 0, 0, template.width, template.height);

  const avatarUrl = user.displayAvatarURL({ extension: 'png', size: 512, forceStatic: true });
  const avatar = await loadImage(avatarUrl);

  ctx.save();
  ctx.beginPath();
  ctx.arc(AVATAR_CENTER_X, AVATAR_CENTER_Y, AVATAR_RADIUS, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(
    avatar,
    AVATAR_CENTER_X - AVATAR_RADIUS,
    AVATAR_CENTER_Y - AVATAR_RADIUS,
    AVATAR_RADIUS * 2,
    AVATAR_RADIUS * 2,
  );
  ctx.restore();

  ctx.fillStyle = '#111111';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';

  const username = fitUsername(user.username);
  ctx.font = "900 68px 'Arial'";
  ctx.fillText(username, USERNAME_TEXT_X, USERNAME_TEXT_Y);

  ctx.font = "900 72px 'Arial'";
  ctx.fillText(`Nível ${level}`, LEVEL_TEXT_X, LEVEL_TEXT_Y);

  return canvas.toBuffer('image/png');
}

async function sendLevelUpAnnouncement(options: {
  guild: Guild;
  userId: string;
  user?: User;
  track: ProgressTrack;
  level: number;
  roleName: string | null;
}) {
  if (!config.levelUpChannelId) return;

  const channel = await options.guild.channels.fetch(config.levelUpChannelId).catch((error) => {
    console.error('Erro ao obter canal de level-up:', error);
    return null;
  });
  if (!channel || !channel.isTextBased()) return;

  const user =
    options.user || (await options.guild.client.users.fetch(options.userId).catch(() => null));
  if (!user) return;

  const content = `Parabéns, <@${options.userId}>! 😀`;

  try {
    const cardBuffer = await buildLevelUpCard(user, options.level);
    const attachment = new AttachmentBuilder(cardBuffer, { name: 'level-up.png' });
    await channel.send({ content, files: [attachment] });
  } catch (error) {
    console.error('Erro ao gerar/enviar card de level-up:', error);
    await channel.send({ content });
  }
}

async function awardXp(options: {
  guild: Guild;
  userId: string;
  user?: User;
  track: ProgressTrack;
  xpGain: number;
  cooldownMs: number;
}) {
  if (config.xpExcludedUserIds.includes(options.userId)) {
    return;
  }

  const supabase = getSupabase();

  const { data: existing, error: readError } = await supabase
    .from('discord_level_progress')
    .select('guild_id, discord_user_id, track, xp, level, last_xp_at')
    .eq('guild_id', options.guild.id)
    .eq('discord_user_id', options.userId)
    .eq('track', options.track)
    .maybeSingle<ProgressRow>();

  if (readError) {
    if (isMissingTableError(readError)) {
      logMissingTableWarningOnce();
      return;
    }
    console.error('Erro ao ler progresso de níveis:', readError);
    return;
  }

  if (existing?.last_xp_at) {
    const lastAwardAt = new Date(existing.last_xp_at).getTime();
    if (Date.now() - lastAwardAt < options.cooldownMs) {
      return;
    }
  }

  const previousXp = existing?.xp ?? 0;
  const previousLevel = existing?.level ?? calculateLevelFromXp(previousXp);
  const nextXp = previousXp + options.xpGain;
  const nextLevel = calculateLevelFromXp(nextXp);
  const leveledUp = nextLevel > previousLevel;
  const nowIso = new Date().toISOString();

  const { error: saveError } = await supabase.from('discord_level_progress').upsert(
    {
      guild_id: options.guild.id,
      discord_user_id: options.userId,
      track: options.track,
      xp: nextXp,
      level: nextLevel,
      last_xp_at: nowIso,
      updated_at: nowIso,
    },
    { onConflict: 'guild_id,discord_user_id,track' },
  );

  if (saveError) {
    if (isMissingTableError(saveError)) {
      logMissingTableWarningOnce();
      return;
    }
    console.error('Erro ao guardar progresso de níveis:', saveError);
    return;
  }

  const assignedRoleName = await syncTrackRole(options.guild, options.userId, options.track, nextLevel).catch(
    (error) => {
      console.error('Erro ao sincronizar cargo de níveis:', error);
      return null;
    },
  );

  await maybeSendXpDm({
    user: options.user,
    guild: options.guild,
    userId: options.userId,
    track: options.track,
    xpGain: options.xpGain,
    totalXp: nextXp,
    level: nextLevel,
    leveledUp,
    roleName: assignedRoleName,
  });

  if (leveledUp) {
    await sendLevelUpAnnouncement({
      guild: options.guild,
      userId: options.userId,
      user: options.user,
      track: options.track,
      level: nextLevel,
      roleName: assignedRoleName,
    });
  }
}

export async function verifyLevelSystemTable() {
  const supabase = getSupabase();
  const { error } = await supabase.from('discord_level_progress').select('guild_id').limit(1);
  if (error && isMissingTableError(error)) {
    logMissingTableWarningOnce();
  }
}

export async function bootstrapLevelRoles(guild: Guild) {
  const roleNames = Array.from(
    new Set([...HELPER_ROLE_TIERS.map((item) => item.roleName), ...STUDENT_ROLE_TIERS.map((item) => item.roleName)]),
  );

  for (const roleName of roleNames) {
    await ensureRoleByName(guild, roleName);
  }
}

export async function handleDoubtsThreadCreated(thread: ThreadChannel<boolean>) {
  if (thread.parentId !== config.doubtsChannelId) return;

  const ownerId = await resolveThreadOwnerId(thread);
  if (!ownerId || ownerId === thread.client.user?.id) return;

  await awardXp({
    guild: thread.guild,
    userId: ownerId,
    track: 'student',
    xpGain: XP_PER_STUDENT_THREAD,
    cooldownMs: STUDENT_COOLDOWN_MS,
  });
}

export async function handleDoubtsThreadMessage(message: Message<boolean>) {
  if (!message.inGuild() || message.author.bot || !message.channel.isThread()) return;
  if (message.channel.parentId !== config.doubtsChannelId) return;

  const threadOwnerId = await resolveThreadOwnerId(message.channel);
  if (!threadOwnerId) return;
  if (threadOwnerId === message.author.id) return;

  await awardXp({
    guild: message.guild,
    userId: message.author.id,
    user: message.author,
    track: 'helper',
    xpGain: XP_PER_HELPER_REPLY,
    cooldownMs: HELPER_COOLDOWN_MS,
  });
}
