import { ChatInputCommandInteraction, EmbedBuilder, MessageFlags } from 'discord.js';
import { getSupabase } from '../database';
import {
  ProgressTrack,
  calculateLevelFromXp,
  getMinXpForLevel,
  getRoleForLevel,
  getTrackLabel,
} from '../levels';

type ProgressRow = {
  discord_user_id: string;
  track: ProgressTrack;
  xp: number;
  level: number;
  updated_at: string;
};

function isMissingTableError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const message = String((error as { message?: string }).message || '').toLowerCase();
  return message.includes('discord_level_progress');
}

function formatTrackProgress(track: ProgressTrack, xp: number) {
  const level = calculateLevelFromXp(xp);
  const currentLevelBaseXp = getMinXpForLevel(level);
  const nextLevel = level + 1;
  const nextLevelXp = getMinXpForLevel(nextLevel);
  const neededForNextLevel = Math.max(0, nextLevelXp - xp);
  const levelRangeXp = Math.max(1, nextLevelXp - currentLevelBaseXp);
  const progressInLevel = Math.max(0, Math.min(levelRangeXp, xp - currentLevelBaseXp));
  const percentage = Math.floor((progressInLevel / levelRangeXp) * 100);
  const currentRole = getRoleForLevel(track, level) || 'Sem cargo ainda';

  return {
    level,
    nextLevel,
    currentRole,
    neededForNextLevel,
    percentage,
  };
}

export async function handleNivelCommand(interaction: ChatInputCommandInteraction) {
  if (!interaction.guildId) {
    await interaction.reply({ content: 'Este comando só pode ser usado no servidor.', flags: MessageFlags.Ephemeral });
    return;
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  const targetUser = interaction.options.getUser('utilizador') || interaction.user;
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('discord_level_progress')
    .select('discord_user_id, track, xp, level, updated_at')
    .eq('guild_id', interaction.guildId)
    .eq('discord_user_id', targetUser.id);

  if (error) {
    const message = isMissingTableError(error)
      ? 'A tabela de níveis ainda não está disponível no Supabase.'
      : 'Não foi possível carregar o teu nível agora.';
    await interaction.editReply({ content: message });
    return;
  }

  const helperXp = (data || []).find((row) => row.track === 'helper')?.xp || 0;
  const studentXp = (data || []).find((row) => row.track === 'student')?.xp || 0;

  const helper = formatTrackProgress('helper', helperXp);
  const student = formatTrackProgress('student', studentXp);

  const embed = new EmbedBuilder()
    .setColor(0xffffff)
    .setTitle(`📊 Nível de ${targetUser.username}`)
    .addFields(
      {
        name: '🛠️ Ajudante',
        value:
          `XP: **${helperXp}**\n` +
          `Nível: **${helper.level}** (${helper.percentage}% para o próximo)\n` +
          `Cargo: **${helper.currentRole}**\n` +
          `Faltam **${helper.neededForNextLevel} XP** para nível ${helper.nextLevel}`,
        inline: false,
      },
      {
        name: '📚 Estudante',
        value:
          `XP: **${studentXp}**\n` +
          `Nível: **${student.level}** (${student.percentage}% para o próximo)\n` +
          `Cargo: **${student.currentRole}**\n` +
          `Faltam **${student.neededForNextLevel} XP** para nível ${student.nextLevel}`,
        inline: false,
      },
    )
    .setFooter({ text: 'MatemáticaTop © 2026 | matematica.top' });

  await interaction.editReply({ embeds: [embed] });
}

export async function handleXpCommand(interaction: ChatInputCommandInteraction) {
  if (!interaction.guildId) {
    await interaction.reply({ content: 'Este comando só pode ser usado no servidor.', flags: MessageFlags.Ephemeral });
    return;
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  const track = (interaction.options.getString('percurso') || 'helper') as ProgressTrack;
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('discord_level_progress')
    .select('discord_user_id, track, xp, level, updated_at')
    .eq('guild_id', interaction.guildId)
    .eq('discord_user_id', interaction.user.id)
    .eq('track', track)
    .maybeSingle<ProgressRow>();

  if (error) {
    const message = isMissingTableError(error)
      ? 'A tabela de níveis ainda não está disponível no Supabase.'
      : 'Não foi possível carregar o teu XP agora.';
    await interaction.editReply({ content: message });
    return;
  }

  const xp = data?.xp || 0;
  const details = formatTrackProgress(track, xp);

  const embed = new EmbedBuilder()
    .setColor(0xffffff)
    .setTitle(`✨ O teu XP · ${getTrackLabel(track)}`)
    .setDescription(
      `XP: **${xp}**\n` +
      `Nível: **${details.level}**\n` +
      `Cargo atual: **${details.currentRole}**\n` +
      `Faltam **${details.neededForNextLevel} XP** para o nível ${details.nextLevel}.`,
    )
    .setFooter({ text: 'MatemáticaTop © 2026 | matematica.top' });

  await interaction.editReply({ embeds: [embed] });
}

export async function handleRankingCommand(interaction: ChatInputCommandInteraction) {
  if (!interaction.guildId) {
    await interaction.reply({ content: 'Este comando só pode ser usado no servidor.', flags: MessageFlags.Ephemeral });
    return;
  }

  await interaction.deferReply();
  const track = (interaction.options.getString('percurso') || 'helper') as ProgressTrack;
  const limit = interaction.options.getInteger('limite') || 10;
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('discord_level_progress')
    .select('discord_user_id, track, xp, level, updated_at')
    .eq('guild_id', interaction.guildId)
    .eq('track', track)
    .order('xp', { ascending: false })
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (error) {
    const message = isMissingTableError(error)
      ? 'A tabela de níveis ainda não está disponível no Supabase.'
      : 'Não foi possível carregar o ranking agora.';
    await interaction.editReply({ content: message });
    return;
  }

  const rows = (data || []) as ProgressRow[];
  if (rows.length === 0) {
    await interaction.editReply({
      content: `Ainda não há pontuação no ranking de ${getTrackLabel(track)}.`,
    });
    return;
  }

  const lines = rows.map((row, idx) => {
    const level = calculateLevelFromXp(row.xp);
    const role = getRoleForLevel(track, level) || 'Sem cargo';
    return `**${idx + 1}.** <@${row.discord_user_id}> · **${row.xp} XP** · nível **${level}** · ${role}`;
  });

  const embed = new EmbedBuilder()
    .setColor(0xffffff)
    .setTitle(`🏆 Ranking · ${getTrackLabel(track)}`)
    .setDescription(lines.join('\n'))
    .setFooter({ text: 'MatemáticaTop © 2026 | matematica.top' });

  await interaction.editReply({ embeds: [embed] });
}
