import {
  ButtonInteraction,
  StringSelectMenuInteraction,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  EmbedBuilder,
} from 'discord.js';
import {
  EXAM_YEARS,
  getSchoolYears,
  getBroadTopicsForYear,
  getBroadTopic,
  getSubtopicsForBroadTopic,
  getOccurrencesForSubtopic,
  countOccurrences,
  isSingleSubtopic,
} from '../data/examTopics';
import { getProfileByDiscordId } from '../database';
import { createNeedsAuthEmbed } from '../embeds';

// Colors
const EMBED_COLOR = 0xffffff;
const SUCCESS_COLOR = 0x22c55e;

// Store exam topics state per user
const examTopicsState = new Map<string, {
  schoolYear?: string;
  broadTopic?: string;
  subtopic?: string;
}>();

export async function handleStartExamTopics(interaction: ButtonInteraction) {
  const profile = await getProfileByDiscordId(interaction.user.id);

  if (!profile) {
    const { embed, row } = createNeedsAuthEmbed();
    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    return;
  }

  // Clear any previous state
  examTopicsState.set(interaction.user.id, {});

  // Show school year selection
  const schoolYears = getSchoolYears();

  const select = new StringSelectMenuBuilder()
    .setCustomId('select_exam_school_year')
    .setPlaceholder('Escolhe o ano escolar')
    .addOptions(
      schoolYears.map(year => ({
        label: year,
        value: year,
      }))
    );

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);

  const embed = new EmbedBuilder()
    .setColor(EMBED_COLOR)
    .setTitle('📊 O que sai nos exames')
    .setDescription(
      'Descobre quais os temas que mais saem nos exames de Matemática A.\n\n' +
      '**Seleciona o ano escolar** para ver os temas disponíveis.\n\n' +
      '💡 *Lembra-te: embora alguns temas apareçam com maior frequência, todos devem ser estudados, pois podem sempre sair no exame!*'
    )
    .setFooter({ text: 'MatemáticaTop © 2026 | matematica.top' });

  await interaction.reply({
    embeds: [embed],
    components: [row],
    ephemeral: true,
  });
}

export async function handleExamSchoolYearSelection(interaction: StringSelectMenuInteraction) {
  const schoolYear = interaction.values[0];
  
  // Update state
  const state = examTopicsState.get(interaction.user.id) || {};
  state.schoolYear = schoolYear;
  examTopicsState.set(interaction.user.id, state);

  // Get broad topics for this year
  const broadTopics = getBroadTopicsForYear(schoolYear);

  const select = new StringSelectMenuBuilder()
    .setCustomId('select_exam_broad_topic')
    .setPlaceholder('Escolhe o tema')
    .addOptions(
      broadTopics.map(topic => ({
        label: topic,
        value: topic,
      }))
    );

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);

  const embed = new EmbedBuilder()
    .setColor(EMBED_COLOR)
    .setTitle('📊 O que sai nos exames')
    .setDescription(
      `**Ano:** ${schoolYear}\n\n` +
      '**Seleciona o tema** que pretendes consultar.'
    )
    .setFooter({ text: 'MatemáticaTop © 2026 | matematica.top' });

  await interaction.update({
    embeds: [embed],
    components: [row],
  });
}

export async function handleExamBroadTopicSelection(interaction: StringSelectMenuInteraction) {
  const broadTopic = interaction.values[0];
  
  // Get state
  const state = examTopicsState.get(interaction.user.id);
  if (!state || !state.schoolYear) {
    await interaction.update({
      embeds: [createErrorEmbed('Sessão expirada. Por favor, começa de novo.')],
      components: [],
    });
    return;
  }

  state.broadTopic = broadTopic;
  examTopicsState.set(interaction.user.id, state);

  // Check if this topic has only one subtopic (show results directly)
  if (isSingleSubtopic(state.schoolYear, broadTopic)) {
    // Get the single subtopic
    const subtopics = getSubtopicsForBroadTopic(state.schoolYear, broadTopic);
    if (subtopics.length > 0) {
      state.subtopic = subtopics[0];
      await showResultsTable(interaction, state.schoolYear, state.broadTopic, state.subtopic);
      return;
    }
  }

  // Get subtopics for this broad topic
  const subtopics = getSubtopicsForBroadTopic(state.schoolYear, broadTopic);

  const select = new StringSelectMenuBuilder()
    .setCustomId('select_exam_subtopic')
    .setPlaceholder('Escolhe o subtema')
    .addOptions(
      subtopics.map(topic => ({
        label: topic.length > 100 ? topic.substring(0, 97) + '...' : topic,
        value: topic.length > 100 ? topic.substring(0, 100) : topic,
      }))
    );

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);

  const embed = new EmbedBuilder()
    .setColor(EMBED_COLOR)
    .setTitle('📊 O que sai nos exames')
    .setDescription(
      `**Ano:** ${state.schoolYear}\n` +
      `**Tema:** ${broadTopic}\n\n` +
      '**Seleciona o subtema** específico que pretendes consultar.'
    )
    .setFooter({ text: 'MatemáticaTop © 2026 | matematica.top' });

  await interaction.update({
    embeds: [embed],
    components: [row],
  });
}

export async function handleExamSubtopicSelection(interaction: StringSelectMenuInteraction) {
  const subtopic = interaction.values[0];
  
  // Get state
  const state = examTopicsState.get(interaction.user.id);
  if (!state || !state.schoolYear || !state.broadTopic) {
    await interaction.update({
      embeds: [createErrorEmbed('Sessão expirada. Por favor, começa de novo.')],
      components: [],
    });
    return;
  }

  state.subtopic = subtopic;
  await showResultsTable(interaction, state.schoolYear, state.broadTopic, subtopic);
}

// Show the results table
async function showResultsTable(
  interaction: StringSelectMenuInteraction,
  schoolYear: string,
  broadTopic: string,
  subtopic: string
) {
  // Get occurrences
  const occurrences = getOccurrencesForSubtopic(schoolYear, broadTopic, subtopic);
  
  if (!occurrences) {
    await interaction.update({
      embeds: [createErrorEmbed('Não foi possível encontrar dados para este tema.')],
      components: [],
    });
    examTopicsState.delete(interaction.user.id);
    return;
  }

  const totalOccurrences = countOccurrences(occurrences);
  const totalExams = EXAM_YEARS.length * 2; // 2 phases per year

  // Create the table
  const table = formatOccurrencesTable(occurrences);

  // Determine frequency level
  let frequencyText = '';
  let frequencyEmoji = '';
  const percentage = (totalOccurrences / totalExams) * 100;
  
  if (percentage >= 80) {
    frequencyText = 'Muito frequente';
    frequencyEmoji = '🔴';
  } else if (percentage >= 50) {
    frequencyText = 'Frequente';
    frequencyEmoji = '🟠';
  } else if (percentage >= 25) {
    frequencyText = 'Ocasional';
    frequencyEmoji = '🟡';
  } else {
    frequencyText = 'Pouco frequente';
    frequencyEmoji = '🟢';
  }

  // Special note for Estatística
  const estatisticaNote = subtopic === 'Estatística' 
    ? '\n\n📈 *A tendência é que Estatística volte a sair nos próximos exames.*'
    : '';

  // Build description based on whether it's a single subtopic or not
  const isSingle = isSingleSubtopic(schoolYear, broadTopic);
  const descHeader = isSingle 
    ? `**Ano:** ${schoolYear}\n**Tema:** ${broadTopic}\n\n`
    : `**Ano:** ${schoolYear}\n**Tema:** ${broadTopic}\n**Subtema:** ${subtopic}\n\n`;

  const embed = new EmbedBuilder()
    .setColor(SUCCESS_COLOR)
    .setTitle(`📊 ${subtopic}`)
    .setDescription(
      descHeader +
      `${frequencyEmoji} **${frequencyText}** — Apareceu em **${totalOccurrences}** de ${totalExams} exames (${Math.round(percentage)}%)\n\n` +
      `**Ocorrências por ano:**\n${table}\n\n` +
      `*✓ = Saiu no exame  •  - = Não saiu*${estatisticaNote}\n\n` +
      `💡 *Mesmo os temas menos frequentes podem sair! Estuda todos os temas do programa.*`
    )
    .setFooter({ text: 'MatemáticaTop © 2026 | matematica.top' });

  await interaction.update({
    embeds: [embed],
    components: [],
  });

  // Clear state
  examTopicsState.delete(interaction.user.id);
}

// Format occurrences as a Discord-friendly table
function formatOccurrencesTable(
  occurrences: Record<string, boolean>
): string {
  const years = EXAM_YEARS;
  
  // Create a compact table using code block
  let table = '```\n';
  table += '  Ano   │ 1ªF │ 2ªF\n';
  table += '────────┼─────┼─────\n';
  
  for (const year of years) {
    const f1 = occurrences[`${year}_F1`] ? ' ✓ ' : ' - ';
    const f2 = occurrences[`${year}_F2`] ? ' ✓ ' : ' - ';
    table += `  ${year}  │${f1}│${f2}\n`;
  }
  
  table += '```';
  
  return table;
}

// Error embed helper
function createErrorEmbed(message: string): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(0xef4444)
    .setTitle('❌ Erro')
    .setDescription(message)
    .setFooter({ text: 'MatemáticaTop © 2026 | matematica.top' });
}
