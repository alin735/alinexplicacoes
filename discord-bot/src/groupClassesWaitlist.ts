import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ChannelType,
  EmbedBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
} from 'discord.js';
import { config } from './config';

const WAITLIST_OPEN_BUTTON_ID = 'group_waitlist_open';
const WAITLIST_PREF_CUSTOM_ID = 'group_waitlist_pref';
const WAITLIST_SUBMIT_BUTTON_ID = 'group_waitlist_submit';

const waitlistPreferenceCache = new Map<string, string>();

function formatPreferenceLabel(preference: string) {
  if (preference === 'materia_9') return 'Matéria atual do 9º Ano';
  if (preference === 'exame_9') return 'Preparação para o exame';
  return preference;
}

function buildWaitlistEmbed() {
  return new EmbedBuilder()
    .setColor(0xffffff)
    .setTitle('📚 Lista de espera · Aulas de grupo')
    .setDescription(
      'Este formulário é privado e só tu o consegues ver.\n\n1. Escolhe o tipo de aula que preferes.\n2. Clica em **Entrar na lista de espera**.',
    )
    .setFooter({ text: 'MatemáticaTop © 2026 | matematica.top' });
}

function buildWaitlistComponents() {
  const select = new StringSelectMenuBuilder()
    .setCustomId(WAITLIST_PREF_CUSTOM_ID)
    .setPlaceholder('Escolhe o foco das aulas')
    .addOptions(
      {
        label: 'Matéria atual do 9º Ano',
        value: 'materia_9',
      },
      {
        label: 'Preparação para o exame',
        value: 'exame_9',
      },
    );

  const button = new ButtonBuilder()
    .setCustomId(WAITLIST_SUBMIT_BUTTON_ID)
    .setLabel('Entrar na lista de espera')
    .setStyle(ButtonStyle.Primary);

  return [
    new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select),
    new ActionRowBuilder<ButtonBuilder>().addComponents(button),
  ];
}

export function createGroupClassesTeaserComponents() {
  const button = new ButtonBuilder()
    .setCustomId(WAITLIST_OPEN_BUTTON_ID)
    .setLabel('Quero participar nas aulas de grupo')
    .setStyle(ButtonStyle.Primary);

  return [new ActionRowBuilder<ButtonBuilder>().addComponents(button)];
}

export async function handleGroupClassesWaitlistOpenButton(interaction: ButtonInteraction) {
  if (interaction.customId !== WAITLIST_OPEN_BUTTON_ID) return;
  await interaction.reply({
    embeds: [buildWaitlistEmbed()],
    components: buildWaitlistComponents(),
    ephemeral: true,
  });
}

export async function handleGroupClassesWaitlistSelect(interaction: StringSelectMenuInteraction) {
  if (interaction.customId !== WAITLIST_PREF_CUSTOM_ID) return;
  const selected = interaction.values[0] || '';
  waitlistPreferenceCache.set(interaction.user.id, selected);

  await interaction.reply({
    content: `✅ Preferência guardada: **${formatPreferenceLabel(selected)}**.`,
    ephemeral: true,
  });
}

export async function handleGroupClassesWaitlistSubmitButton(interaction: ButtonInteraction) {
  if (interaction.customId !== WAITLIST_SUBMIT_BUTTON_ID) return;
  const preference = waitlistPreferenceCache.get(interaction.user.id);
  if (!preference) {
    await interaction.reply({
      content: 'Primeiro escolhe o tipo de aula no menu.',
      ephemeral: true,
    });
    return;
  }

  const notifyChannel = config.groupClassesWaitlistNotifyChannelId
    ? await interaction.client.channels.fetch(config.groupClassesWaitlistNotifyChannelId).catch(() => null)
    : null;

  if (notifyChannel && notifyChannel.type === ChannelType.GuildText) {
    const embed = new EmbedBuilder()
      .setColor(0xffffff)
      .setTitle('📝 Nova entrada na lista de espera')
      .addFields(
        { name: 'Utilizador', value: `<@${interaction.user.id}> (\`${interaction.user.id}\`)` },
        { name: 'Preferência', value: formatPreferenceLabel(preference) },
      )
      .setTimestamp(new Date());

    await notifyChannel.send({ embeds: [embed] }).catch(() => null);
  }

  waitlistPreferenceCache.delete(interaction.user.id);

  await interaction.reply({
    content: '✅ Registo submetido. Entraste na lista de espera das aulas de grupo.',
    ephemeral: true,
  });
}
