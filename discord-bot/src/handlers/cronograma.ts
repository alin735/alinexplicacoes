import {
  ButtonInteraction,
  StringSelectMenuInteraction,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  AttachmentBuilder,
} from 'discord.js';
import { STUDY_START_OPTIONS, DIFFICULTY_TOPICS } from '../config';
import { getProfileByDiscordId } from '../database';
import {
  createNeedsAuthEmbed,
  createCronogramaResultEmbed,
  getCronogramaFilePath,
  createErrorEmbed,
} from '../embeds';
import fs from 'fs';
import path from 'path';

// Store cronograma state per user
const cronogramaState = new Map<string, {
  studyStart?: string;
  difficultyTopic?: string;
}>();

export async function handleStartCronograma(interaction: ButtonInteraction) {
  await interaction.deferReply({ ephemeral: true });
  const profile = await getProfileByDiscordId(interaction.user.id);

  if (!profile) {
    const { embed, row } = createNeedsAuthEmbed();
    await interaction.editReply({ embeds: [embed], components: [row] });
    return;
  }

  // Clear any previous state
  cronogramaState.set(interaction.user.id, {});

  // Show study start selection
  const select = new StringSelectMenuBuilder()
    .setCustomId('select_study_start')
    .setPlaceholder('Altura em que vais começar a estudar')
    .addOptions(
      STUDY_START_OPTIONS.map(opt => ({
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
  const studyStart = interaction.values[0];
  
  // Update state
  const state = cronogramaState.get(interaction.user.id) || {};
  state.studyStart = studyStart;
  cronogramaState.set(interaction.user.id, state);

  // Get label for display
  const studyStartLabel = STUDY_START_OPTIONS.find(o => o.value === studyStart)?.label || studyStart;

  // If "2 semanas" is selected, deliver the cronograma directly (no topic needed)
  if (studyStart === '2s') {
    const filePath = getCronogramaFilePath('2s', ''); // No topic for 2s
    
    if (!fs.existsSync(filePath)) {
      await interaction.editReply({
        embeds: [createErrorEmbed(`Cronograma não encontrado. Por favor, contacta o suporte.`)],
        components: [],
      });
      cronogramaState.delete(interaction.user.id);
      return;
    }

    const embed = createCronogramaResultEmbed('2s', '');
    const fileName = path.basename(filePath);
    const attachment = new AttachmentBuilder(filePath, { name: fileName });

    await interaction.editReply({
      embeds: [embed],
      files: [attachment],
      components: [],
    });

    cronogramaState.delete(interaction.user.id);
    return;
  }

  // Show difficulty topic selection for other durations
  const select = new StringSelectMenuBuilder()
    .setCustomId('select_difficulty_topic')
    .setPlaceholder('Tema com mais dificuldade')
    .addOptions(
      DIFFICULTY_TOPICS.map(opt => ({
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
  const difficultyTopic = interaction.values[0];
  
  // Get state
  const state = cronogramaState.get(interaction.user.id);
  if (!state || !state.studyStart) {
    await interaction.editReply({
      embeds: [createErrorEmbed('Sessão expirada. Por favor, começa de novo.')],
      components: [],
    });
    return;
  }

  state.difficultyTopic = difficultyTopic;

  // Get the cronograma file path
  const filePath = getCronogramaFilePath(state.studyStart, difficultyTopic);
  
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    await interaction.editReply({
      embeds: [createErrorEmbed(`Cronograma não encontrado. Por favor, contacta o suporte.`)],
      components: [],
    });
    cronogramaState.delete(interaction.user.id);
    return;
  }

  // Create embed
  const embed = createCronogramaResultEmbed(state.studyStart, difficultyTopic);

  // Create attachment
  const fileName = path.basename(filePath);
  const attachment = new AttachmentBuilder(filePath, { name: fileName });

  await interaction.editReply({
    embeds: [embed],
    files: [attachment],
    components: [],
  });

  // Clear state
  cronogramaState.delete(interaction.user.id);
}
