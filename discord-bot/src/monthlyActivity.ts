import {
  ChatInputCommandInteraction,
  Client,
  EmbedBuilder,
  Guild,
  GuildBasedChannel,
  Message,
  MessageFlags,
} from 'discord.js';
import { config } from './config';

type MonthlyLeader = {
  monthKey: string;
  leaderUserId: string | null;
  messageCount: number;
  topEntries: Array<{ userId: string; count: number }>;
};

const LISBON_TIME_ZONE = 'Europe/Lisbon';
const MONTHLY_ACTIVITY_CHANNEL_IDS = new Set([
  '1449014426287210526', // #geral
]);

let cachedMonthKey = '';
let cachedCounts = new Map<string, number>();
let scheduledRescan: NodeJS.Timeout | null = null;

function getLisbonMonthKey(date: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: LISBON_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(date);

  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  return `${year}-${month}`;
}

function getLisbonMonthLabel(monthKey: string) {
  const [year, month] = monthKey.split('-').map(Number);
  if (!year || !month) return monthKey;
  return new Intl.DateTimeFormat('pt-PT', {
    timeZone: LISBON_TIME_ZONE,
    month: 'long',
    year: 'numeric',
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

function getPreviousMonthKey(date: Date) {
  const currentMonthKey = getLisbonMonthKey(date);
  const [year, month] = currentMonthKey.split('-').map(Number);
  if (!year || !month) return currentMonthKey;

  const previousMonthDate = new Date(Date.UTC(year, month - 2, 1));
  return getLisbonMonthKey(previousMonthDate);
}

function isCountableMessage(message: Message<boolean>): message is Message<true> {
  return (
    message.inGuild() &&
    !message.author.bot &&
    !config.xpExcludedUserIds.includes(message.author.id) &&
    !message.system &&
    !message.webhookId
  );
}

function supportsMessages(channel: GuildBasedChannel) {
  return 'messages' in channel && typeof channel.messages?.fetch === 'function';
}

async function ensureRoleByName(guild: Guild, roleName: string) {
  const lowerName = roleName.toLowerCase();
  let role = guild.roles.cache.find((item) => item.name.toLowerCase() === lowerName) || null;

  if (!role) {
    const fetched = await guild.roles.fetch();
    role = fetched.find((item) => item?.name.toLowerCase() === lowerName) || null;
  }

  if (role) return role;

  return guild.roles.create({
    name: roleName,
    reason: 'Cargo automático do membro mais ativo do mês',
    mentionable: false,
    hoist: false,
  });
}

async function collectCandidateChannels(guild: Guild) {
  const channels = await guild.channels.fetch();
  const candidates: GuildBasedChannel[] = [];

  channels.forEach((channel) => {
    if (!channel) return;
    if (supportsMessages(channel) && MONTHLY_ACTIVITY_CHANNEL_IDS.has(channel.id)) {
      candidates.push(channel);
    }
  });

  const activeThreads = await guild.channels.fetchActiveThreads().catch(() => null);
  activeThreads?.threads.forEach((thread) => {
    if (supportsMessages(thread) && thread.parentId === config.doubtsChannelId) {
      candidates.push(thread);
    }
  });

  return candidates;
}

async function countMessagesForMonthInChannel(channel: GuildBasedChannel, targetMonthKey: string) {
  const counts = new Map<string, number>();
  let before: string | undefined;

  while (true) {
    if (!supportsMessages(channel)) {
      break;
    }

    const textChannel = channel as GuildBasedChannel & {
      messages: { fetch: (options: { limit: number; before?: string }) => Promise<any> };
    };

    const batch = await textChannel.messages.fetch({ limit: 100, before }).catch(() => null);
    if (!batch || batch.size === 0) {
      break;
    }

    const messages = [...batch.values()];
    let sawTargetMonth = false;

    for (const message of messages) {
      if (!isCountableMessage(message)) {
        continue;
      }

      const messageMonthKey = getLisbonMonthKey(message.createdAt);

      if (messageMonthKey === targetMonthKey) {
        sawTargetMonth = true;
        counts.set(message.author.id, (counts.get(message.author.id) ?? 0) + 1);
      }
    }

    const oldestMessage = messages[messages.length - 1];
    if (!oldestMessage) {
      break;
    }

    const oldestMonthKey = getLisbonMonthKey(oldestMessage.createdAt);
    if (oldestMonthKey < targetMonthKey && !sawTargetMonth) {
      break;
    }

    if (oldestMonthKey < targetMonthKey) {
      break;
    }

    before = oldestMessage.id;
  }

  return counts;
}

async function scanGuildMonthCounts(guild: Guild, monthKey: string) {
  const aggregated = new Map<string, number>();
  const channels = await collectCandidateChannels(guild);

  for (const channel of channels) {
    const channelCounts = await countMessagesForMonthInChannel(channel, monthKey);
    channelCounts.forEach((count, userId) => {
      aggregated.set(userId, (aggregated.get(userId) ?? 0) + count);
    });
  }

  return aggregated;
}

function getTopEntries(counts: Map<string, number>) {
  return [...counts.entries()]
    .map(([userId, count]) => ({ userId, count }))
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.userId.localeCompare(b.userId);
    });
}

async function getMonthlyLeaderFromCache(guild: Guild): Promise<MonthlyLeader> {
  const topEntries = getTopEntries(cachedCounts);
  const role = guild.roles.cache.find(
    (item) => item.name.toLowerCase() === config.monthlyActiveRoleName.toLowerCase(),
  ) || null;

  const currentHolderId =
    role?.members
      .sort((a, b) => a.user.id.localeCompare(b.user.id))
      .first()
      ?.id || null;

  const highestCount = topEntries[0]?.count ?? 0;
  const tiedLeaders = topEntries.filter((entry) => entry.count === highestCount);
  const preservedLeader =
    currentHolderId && tiedLeaders.some((entry) => entry.userId === currentHolderId)
      ? currentHolderId
      : tiedLeaders[0]?.userId || null;

  return {
    monthKey: cachedMonthKey,
    leaderUserId: preservedLeader,
    messageCount: highestCount,
    topEntries,
  };
}

async function syncRoleToCurrentLeader(guild: Guild) {
  const leader = await getMonthlyLeaderFromCache(guild);
  const role = await ensureRoleByName(guild, config.monthlyActiveRoleName).catch((error) => {
    console.error('Erro ao garantir o cargo do membro mais ativo:', error);
    return null;
  });

  if (!role) {
    return leader;
  }

  const membersWithRole = [...role.members.values()];
  const removableMembers = membersWithRole.filter((member) => member.id !== leader.leaderUserId);
  for (const member of removableMembers) {
    await member.roles.remove(role, 'Atualização do cargo de membro mais ativo do mês').catch(() => null);
  }

  if (leader.leaderUserId) {
    const leaderMember = await guild.members.fetch(leader.leaderUserId).catch(() => null);
    if (leaderMember && !leaderMember.roles.cache.has(role.id)) {
      await leaderMember.roles.add(role, 'Líder atual de mensagens do mês').catch(() => null);
    }
  }

  return leader;
}

async function rescanReferenceMonth(guild: Guild) {
  cachedMonthKey = getPreviousMonthKey(new Date());
  cachedCounts = await scanGuildMonthCounts(guild, cachedMonthKey);
  return syncRoleToCurrentLeader(guild);
}

async function ensureMonthCache(guild: Guild) {
  const referenceMonthKey = getPreviousMonthKey(new Date());
  if (cachedMonthKey !== referenceMonthKey) {
    await rescanReferenceMonth(guild);
  }
}

export async function bootstrapMonthlyActiveRole(client: Client) {
  const guild = await client.guilds.fetch(config.guildId).catch(() => null);
  if (!guild) {
    console.log('Não foi possível carregar o servidor para sincronizar o cargo mensal de atividade.');
    return;
  }

  await rescanReferenceMonth(guild);

  if (scheduledRescan) {
    clearInterval(scheduledRescan);
  }

  scheduledRescan = setInterval(() => {
    void ensureMonthCache(guild);
  }, config.monthlyActiveSyncIntervalMinutes * 60 * 1000);
}

export async function handleMonthlyActivityMessage(message: Message<boolean>) {
  if (!isCountableMessage(message) || message.guild.id !== config.guildId) {
    return;
  }

  const guild = message.guild;
  await ensureMonthCache(guild);
}

export async function handleMonthlyActivityMemberLeave(guild: Guild) {
  await ensureMonthCache(guild);
  await syncRoleToCurrentLeader(guild);
}

export async function getMonthlyActivitySummary(client: Client) {
  const guild = await client.guilds.fetch(config.guildId);
  await ensureMonthCache(guild);
  const leader = await getMonthlyLeaderFromCache(guild);
  return { guild, leader };
}

export async function syncMonthlyActivityNow(client: Client) {
  const guild = await client.guilds.fetch(config.guildId);
  return rescanReferenceMonth(guild);
}

export async function handleMonthlyActivityStatusCommand(interaction: ChatInputCommandInteraction) {
  if (!interaction.guildId) {
    await interaction.reply({ content: 'Este comando só funciona no servidor.', flags: MessageFlags.Ephemeral });
    return;
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  const guild = interaction.guild;
  if (!guild) {
    await interaction.editReply('Não foi possível carregar o servidor.');
    return;
  }

  await ensureMonthCache(guild);
  const leader = await getMonthlyLeaderFromCache(guild);
  const limit = interaction.options.getInteger('limite') || 10;

  const rankingLines = leader.topEntries.slice(0, limit).map(
    (entry, index) => `**${index + 1}.** <@${entry.userId}> · **${entry.count}** mensagens`,
  );

  const embed = new EmbedBuilder()
    .setColor(0xffffff)
    .setTitle('📈 Membro mais ativo do mês anterior')
    .setDescription(
      leader.leaderUserId
        ? `Vencedor de **${getLisbonMonthLabel(leader.monthKey)}**: <@${leader.leaderUserId}> com **${leader.messageCount}** mensagens.`
        : `Ainda não há mensagens registadas em **${getLisbonMonthLabel(leader.monthKey)}**.`,
    )
    .addFields({
      name: 'Top mensagens do mês anterior',
      value: rankingLines.length > 0 ? rankingLines.join('\n') : '_Sem atividade ainda._',
    })
    .setFooter({ text: `Cargo sincronizado: ${config.monthlyActiveRoleName}` });

  await interaction.editReply({ embeds: [embed] });
}

export async function handleMonthlyActivitySyncCommand(interaction: ChatInputCommandInteraction) {
  if (!interaction.guildId) {
    await interaction.reply({ content: 'Este comando só funciona no servidor.', flags: MessageFlags.Ephemeral });
    return;
  }

  if (!interaction.memberPermissions?.has('Administrator')) {
    await interaction.reply({ content: 'Apenas administradores podem sincronizar este cargo.', flags: MessageFlags.Ephemeral });
    return;
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  const guild = interaction.guild;
  if (!guild) {
    await interaction.editReply('Não foi possível carregar o servidor.');
    return;
  }

  const leader = await rescanReferenceMonth(guild);

  if (!leader?.leaderUserId) {
    await interaction.editReply('Não encontrei mensagens suficientes no mês anterior para atribuir o cargo.');
    return;
  }

  await interaction.editReply(
    `✅ Cargo sincronizado. Vencedor de **${getLisbonMonthLabel(leader.monthKey)}**: <@${leader.leaderUserId}> com **${leader.messageCount}** mensagens.`,
  );
}
