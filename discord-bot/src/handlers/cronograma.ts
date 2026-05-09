import {
  ButtonInteraction,
  StringSelectMenuInteraction,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  AttachmentBuilder,
} from 'discord.js';
import {
  STUDY_START_OPTIONS,
  DIFFICULTY_TOPICS,
  STUDY_START_OPTIONS_9ANO,
  DIFFICULTY_TOPICS_9ANO,
} from '../config';
import { getProfileByDiscordId } from '../database';
import {
  createNeedsAuthEmbed,
  createCronogramaResultEmbed,
  createCronograma9AnoResultEmbed,
  getCronogramaFilePath,
  getCronograma9AnoFilePath,
  createErrorEmbed,
} from '../embeds';
import fs from 'fs';
import path from 'path';

type CronogramaFlowType = '12ano' | '9ano';

function parseFlowType(value: string | undefined): CronogramaFlowType | null {
  if (value === '9ano' || value === '12ano') return value;
  return null;
}

export async function handleStartCronograma(interaction: ButtonInteraction) {
  await startCronogramaFlow(interaction, '12ano');
}

export async function handleStartCronograma9Ano(interaction: ButtonInteraction) {
  await startCronogramaFlow(interaction, '9ano');
}

async function startCronogramaFlow(interaction: ButtonInteraction, type: CronogramaFlowType) {
  await interaction.deferReply({ ephemeral: true });
  const profile = await getProfileByDiscordId(interaction.user.id);

  if (!profile) {
    const { embed, row } = createNeedsAuthEmbed();
    await interaction.editReply({ embeds: [embed], components: [row] });
    return;
  }

  const studyStartOptions = type === '9ano' ? STUDY_START_OPTIONS_9ANO : STUDY_START_OPTIONS;

  const select = new StringSelectMenuBuilder()
    .setCustomId(`select_study_start:${type}`)
    .setPlaceholder('Altura em que vais começar a estudar')
    .addOptions(
      studyStartOptions.map(opt => ({
        label: opt.label,
        value: opt.value,
      }))
    );

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);

  await interaction.editReply({
    embeds: [{
      color: 0xffffff,
      title: '📋 Cronogramas',
      description: 'Seleciona a altura em que vais começar a estudar para o exame.',
      footer: { text: 'MatemáticaTop © 2026 | matematica.top' },
    }],
    components: [row],
  });
}

export async function handleStudyStartSelection(interaction: StringSelectMenuInteraction) {
  await interaction.deferUpdate();
  const [, rawType] = interaction.customId.split(':');
  const flowType = parseFlowType(rawType);
  if (!flowType) {
    await interaction.editReply({
      embeds: [createErrorEmbed('Sessão expirada. Por favor, começa de novo.')],
      components: [],
    });
    return;
  }

  const studyStart = interaction.values[0];

  const studyStartOptions = flowType === '9ano' ? STUDY_START_OPTIONS_9ANO : STUDY_START_OPTIONS;
  const studyStartLabel = studyStartOptions.find(o => o.value === studyStart)?.label || studyStart;

  if (studyStart === '2s') {
    const filePath =
      flowType === '9ano'
        ? getCronograma9AnoFilePath('2s', '')
        : getCronogramaFilePath('2s', '');

    if (!fs.existsSync(filePath)) {
      await interaction.editReply({
        embeds: [createErrorEmbed(`Cronograma não encontrado. Por favor, contacta o suporte.`)],
        components: [],
      });
      return;
    }

    const embed =
      flowType === '9ano'
        ? createCronograma9AnoResultEmbed('2s', '')
        : createCronogramaResultEmbed('2s', '');
    const fileName = path.basename(filePath);
    const attachment = new AttachmentBuilder(filePath, { name: fileName });

    await interaction.editReply({
      embeds: [embed],
      files: [attachment],
      components: [],
    });
    return;
  }

  const difficultyTopics = flowType === '9ano' ? DIFFICULTY_TOPICS_9ANO : DIFFICULTY_TOPICS;
  const select = new StringSelectMenuBuilder()
    .setCustomId(`select_difficulty_topic:${flowType}:${studyStart}`)
    .setPlaceholder('Tema com mais dificuldade')
    .addOptions(
      difficultyTopics.map(opt => ({
        label: opt.label,
        value: opt.value,
      }))
    );

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);

  await interaction.editReply({
    embeds: [{
      color: 0xffffff,
      title: '📋 Cronogramas',
      description: `**Início do estudo:** ${studyStartLabel}\n\nSeleciona o tema em que tens mais dificuldade.`,
      footer: { text: 'MatemáticaTop © 2026 | matematica.top' },
    }],
    components: [row],
  });
}

export async function handleDifficultyTopicSelection(interaction: StringSelectMenuInteraction) {
  await interaction.deferUpdate();
  const [, rawType, studyStart] = interaction.customId.split(':');
  const flowType = parseFlowType(rawType);
  const difficultyTopic = interaction.values[0];

  if (!flowType || !studyStart) {
    await interaction.editReply({
      embeds: [createErrorEmbed('Sessão expirada. Por favor, começa de novo.')],
      components: [],
    });
    return;
  }

  const filePath =
    flowType === '9ano'
      ? getCronograma9AnoFilePath(studyStart, difficultyTopic)
      : getCronogramaFilePath(studyStart, difficultyTopic);

  if (!fs.existsSync(filePath)) {
    await interaction.editReply({
      embeds: [createErrorEmbed(`Cronograma não encontrado. Por favor, contacta o suporte.`)],
      components: [],
    });
    return;
  }

  const embed =
    flowType === '9ano'
      ? createCronograma9AnoResultEmbed(studyStart, difficultyTopic)
      : createCronogramaResultEmbed(studyStart, difficultyTopic);

  const fileName = path.basename(filePath);
  const attachment = new AttachmentBuilder(filePath, { name: fileName });

  await interaction.editReply({
    embeds: [embed],
    files: [attachment],
    components: [],
  });
}
