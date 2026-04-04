import {
  Client,
  GatewayIntentBits,
  Events,
  Interaction,
  TextChannel,
  REST,
  Routes,
  SlashCommandBuilder,
} from 'discord.js';
import { config } from './config';
import { initDatabase } from './database';
import { createExplicacoesEmbed, createExplicacoesInfoEmbed, createCronogramasEmbed, createCronogramasInfoEmbed, createExamTopicsEmbed } from './embeds';
import {
  handleStartBooking,
  handleYearSelection,
  handleTopicSelection,
  handleDateSelection,
  handleSlotSelection,
  handlePayOnline,
  handlePayInPerson,
  handleCancelBooking,
} from './handlers/booking';
import {
  handleStartCronograma,
  handleStudyStartSelection,
  handleDifficultyTopicSelection,
} from './handlers/cronograma';
import {
  handleShowRegister,
  handleShowLogin,
  handleRegisterSubmit,
  handleLoginSubmit,
  handleVerifyLogin,
} from './handlers/auth';
import {
  handleStartExamTopics,
  handleExamSchoolYearSelection,
  handleExamBroadTopicSelection,
  handleExamSubtopicSelection,
} from './handlers/examTopics';

// Create Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
  ],
});

// Register slash commands
async function registerCommands() {
  const commands = [
    new SlashCommandBuilder()
      .setName('setup')
      .setDescription('Configurar mensagens fixas nos canais (apenas admin)')
      .toJSON(),
  ];

  const rest = new REST({ version: '10' }).setToken(config.discordToken);

  try {
    console.log('Registando comandos slash...');
    await rest.put(
      Routes.applicationGuildCommands(client.user!.id, config.guildId),
      { body: commands }
    );
    console.log('Comandos registados com sucesso!');
  } catch (error) {
    console.error('Erro ao registar comandos:', error);
  }
}

// Setup fixed messages in channels
async function setupChannelMessages() {
  try {
    // Setup #explicacoes channel (2 messages: info + action)
    const explicacoesChannel = await client.channels.fetch(config.explicacoesChannelId) as TextChannel;
    if (explicacoesChannel) {
      // First message: informational
      const infoEmbed = createExplicacoesInfoEmbed();
      await explicacoesChannel.send({ embeds: [infoEmbed] });
      
      // Second message: action button
      const { embed, row } = createExplicacoesEmbed();
      await explicacoesChannel.send({ embeds: [embed], components: [row] });
      console.log('Mensagens enviadas para #explicacoes');
    }

    // Setup #cronogramas channel (2 messages: info + action)
    const cronogramasChannel = await client.channels.fetch(config.cronogramasChannelId) as TextChannel;
    if (cronogramasChannel) {
      // First message: informational
      const infoEmbed = createCronogramasInfoEmbed();
      await cronogramasChannel.send({ embeds: [infoEmbed] });
      
      // Second message: action button
      const { embed, row } = createCronogramasEmbed();
      await cronogramasChannel.send({ embeds: [embed], components: [row] });
      console.log('Mensagens enviadas para #cronogramas');
    }

    // Setup #o-que-sai-nos-exames channel
    const examTopicsChannel = await client.channels.fetch(config.examTopicsChannelId) as TextChannel;
    if (examTopicsChannel) {
      const { embed, row } = createExamTopicsEmbed();
      await examTopicsChannel.send({ embeds: [embed], components: [row] });
      console.log('Mensagem enviada para #o-que-sai-nos-exames');
    }
  } catch (error) {
    console.error('Erro ao configurar canais:', error);
  }
}

// Handle interactions
client.on(Events.InteractionCreate, async (interaction: Interaction) => {
  try {
    // Handle slash commands
    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === 'setup') {
        // Check if user is admin
        const member = interaction.guild?.members.cache.get(interaction.user.id);
        if (!member?.permissions.has('Administrator')) {
          await interaction.reply({ content: 'Apenas administradores podem usar este comando.', ephemeral: true });
          return;
        }

        await interaction.deferReply({ ephemeral: true });
        await setupChannelMessages();
        await interaction.editReply('Mensagens configuradas com sucesso!');
        return;
      }
    }

    // Handle button clicks
    if (interaction.isButton()) {
      const customId = interaction.customId;

      // Booking flow
      if (customId === 'start_booking') {
        await handleStartBooking(interaction);
        return;
      }
      if (customId === 'year_10' || customId === 'year_11') {
        await handleYearSelection(interaction);
        return;
      }
      if (customId === 'pay_online') {
        await handlePayOnline(interaction);
        return;
      }
      if (customId === 'pay_in_person') {
        await handlePayInPerson(interaction);
        return;
      }
      if (customId === 'cancel_booking') {
        await handleCancelBooking(interaction);
        return;
      }

      // Cronograma flow
      if (customId === 'start_cronograma') {
        await handleStartCronograma(interaction);
        return;
      }

      // Exam topics flow
      if (customId === 'start_exam_topics') {
        await handleStartExamTopics(interaction);
        return;
      }

      // Auth flow
      if (customId === 'show_register') {
        await handleShowRegister(interaction);
        return;
      }
      if (customId === 'show_login') {
        await handleShowLogin(interaction);
        return;
      }
      if (customId.startsWith('verify_login_')) {
        const token = customId.replace('verify_login_', '');
        await handleVerifyLogin(interaction, token);
        return;
      }
    }

    // Handle select menus
    if (interaction.isStringSelectMenu()) {
      const customId = interaction.customId;

      // Booking flow
      if (customId === 'select_topic') {
        await handleTopicSelection(interaction);
        return;
      }
      if (customId === 'select_date') {
        await handleDateSelection(interaction);
        return;
      }
      if (customId === 'select_slot') {
        await handleSlotSelection(interaction);
        return;
      }

      // Cronograma flow
      if (customId === 'select_study_start') {
        await handleStudyStartSelection(interaction);
        return;
      }
      if (customId === 'select_difficulty_topic') {
        await handleDifficultyTopicSelection(interaction);
        return;
      }

      // Exam topics flow
      if (customId === 'select_exam_school_year') {
        await handleExamSchoolYearSelection(interaction);
        return;
      }
      if (customId === 'select_exam_broad_topic') {
        await handleExamBroadTopicSelection(interaction);
        return;
      }
      if (customId === 'select_exam_subtopic') {
        await handleExamSubtopicSelection(interaction);
        return;
      }
    }

    // Handle modal submissions
    if (interaction.isModalSubmit()) {
      const customId = interaction.customId;

      if (customId === 'register_modal') {
        await handleRegisterSubmit(interaction);
        return;
      }
      if (customId === 'login_modal') {
        await handleLoginSubmit(interaction);
        return;
      }
    }
  } catch (error) {
    console.error('Erro ao processar interação:', error);
    
    // Try to reply with error
    try {
      if (interaction.isRepliable()) {
        const content = 'Ocorreu um erro. Por favor, tenta novamente.';
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({ content, ephemeral: true });
        } else {
          await interaction.reply({ content, ephemeral: true });
        }
      }
    } catch {
      // Ignore
    }
  }
});

// Bot ready event
client.once(Events.ClientReady, async (c) => {
  console.log(`Bot online como ${c.user.tag}!`);
  console.log(`ID: ${c.user.id}`);
  console.log(`Servidor: ${config.guildId}`);
  
  // Register commands
  await registerCommands();
  
  // Initialize database tables
  await initDatabase();
  
  console.log('Bot pronto para receber interações!');
});

// Start the bot
console.log('A iniciar bot Discord...');
client.login(config.discordToken);
