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
import {
  createExplicacoesEmbed,
  createExplicacoesInfoEmbed,
  createCronogramasEmbed,
  createCronogramasInfoEmbed,
  createCronogramas9AnoEmbed,
  createCronogramas9AnoInfoEmbed,
  createExamTopicsEmbed,
} from './embeds';
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
  handleStartCronograma9Ano,
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
import {
  handleNivelCommand,
  handleRankingCommand,
  handleXpCommand,
} from './handlers/levelsCommands';
import {
  bootstrapLevelRoles,
  handleDoubtsThreadCreated,
  handleDoubtsThreadMessage,
  verifyLevelSystemTable,
} from './levels';
import {
  bootstrapChallengeSystem,
  handleChallengeAnswerButton,
  handleChallengeConfigureCommand,
  handleChallengeImportQuestionsCommand,
  handleChallengeMemberJoin,
  handleChallengeMemberLeave,
  handleChallengePauseCommand,
  handleChallengeRankingCommand,
  handleChallengeScheduleCommand,
  handleChallengeSetAnswerKeyCommand,
  handleChallengeStartNowCommand,
  handleChallengeStateCommand,
} from './challenge';

// Create Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildInvites,
  ],
});

// Register slash commands
async function registerCommands() {
  const commands = [
    new SlashCommandBuilder()
      .setName('setup')
      .setDescription('Configurar mensagens fixas nos canais (apenas admin)')
      .toJSON(),
    new SlashCommandBuilder()
      .setName('nivel')
      .setDescription('Ver nível, XP e cargo (teu ou de outro utilizador)')
      .addUserOption(option =>
        option
          .setName('utilizador')
          .setDescription('Utilizador para consultar')
          .setRequired(false)
      )
      .toJSON(),
    new SlashCommandBuilder()
      .setName('xp')
      .setDescription('Ver o teu XP num percurso específico')
      .addStringOption(option =>
        option
          .setName('percurso')
          .setDescription('Percurso a consultar')
          .addChoices(
            { name: 'Ajudante', value: 'helper' },
            { name: 'Estudante', value: 'student' },
          )
          .setRequired(false)
      )
      .toJSON(),
    new SlashCommandBuilder()
      .setName('ranking')
      .setDescription('Ver ranking de XP por percurso')
      .addStringOption(option =>
        option
          .setName('percurso')
          .setDescription('Percurso do ranking')
          .addChoices(
            { name: 'Ajudante', value: 'helper' },
            { name: 'Estudante', value: 'student' },
          )
          .setRequired(false)
      )
      .addIntegerOption(option =>
        option
          .setName('limite')
          .setDescription('Número de membros no ranking (1-20)')
          .setMinValue(1)
          .setMaxValue(20)
          .setRequired(false)
      )
      .toJSON(),
    new SlashCommandBuilder()
      .setName('desafio_configurar')
      .setDescription('Configurar canais e pontuação do desafio (admin)')
      .addChannelOption(option =>
        option
          .setName('canal_9ano')
          .setDescription('Canal das perguntas do 9.º ano')
          .setRequired(false)
      )
      .addChannelOption(option =>
        option
          .setName('canal_12ano')
          .setDescription('Canal das perguntas do 12.º ano')
          .setRequired(false)
      )
      .addChannelOption(option =>
        option
          .setName('canal_ranking')
          .setDescription('Canal do ranking automático')
          .setRequired(false)
      )
      .addIntegerOption(option =>
        option
          .setName('pontos_pergunta')
          .setDescription('XP ganho por resposta correta')
          .setMinValue(1)
          .setMaxValue(5000)
          .setRequired(false)
      )
      .addIntegerOption(option =>
        option
          .setName('pontos_convite')
          .setDescription('Pontos por convite válido')
          .setMinValue(0)
          .setMaxValue(1000)
          .setRequired(false)
      )
      .addIntegerOption(option =>
        option
          .setName('dias')
          .setDescription('Duração do desafio (dias)')
          .setMinValue(1)
          .setMaxValue(60)
          .setRequired(false)
      )
      .toJSON(),
    new SlashCommandBuilder()
      .setName('desafio_importar_perguntas')
      .setDescription('Importar perguntas do desafio a partir de HTML (admin)')
      .addStringOption(option =>
        option
          .setName('ano')
          .setDescription('Ano escolar')
          .addChoices(
            { name: '9.º ano', value: '9ano' },
            { name: '12.º ano', value: '12ano' },
          )
          .setRequired(true)
      )
      .addStringOption(option =>
        option
          .setName('caminho')
          .setDescription('Caminho absoluto do ficheiro HTML')
          .setRequired(false)
      )
      .toJSON(),
    new SlashCommandBuilder()
      .setName('desafio_definir_gabarito')
      .setDescription('Definir gabarito do desafio (admin)')
      .addStringOption(option =>
        option
          .setName('ano')
          .setDescription('Ano escolar')
          .addChoices(
            { name: '9.º ano', value: '9ano' },
            { name: '12.º ano', value: '12ano' },
          )
          .setRequired(true)
      )
      .addStringOption(option =>
        option
          .setName('gabarito')
          .setDescription('Sequência de respostas (ex: ABCDABCD...)')
          .setRequired(true)
      )
      .toJSON(),
    new SlashCommandBuilder()
      .setName('desafio_agendar')
      .setDescription('Agendar início do desafio (admin)')
      .addStringOption(option =>
        option
          .setName('data')
          .setDescription('Data no formato YYYY-MM-DD')
          .setRequired(true)
      )
      .addIntegerOption(option =>
        option
          .setName('hora')
          .setDescription('Hora (0-23)')
          .setMinValue(0)
          .setMaxValue(23)
          .setRequired(true)
      )
      .addIntegerOption(option =>
        option
          .setName('minuto')
          .setDescription('Minuto (0-59)')
          .setMinValue(0)
          .setMaxValue(59)
          .setRequired(true)
      )
      .toJSON(),
    new SlashCommandBuilder()
      .setName('desafio_iniciar_agora')
      .setDescription('Iniciar desafio imediatamente (admin)')
      .toJSON(),
    new SlashCommandBuilder()
      .setName('desafio_pausar')
      .setDescription('Pausar desafio (admin)')
      .toJSON(),
    new SlashCommandBuilder()
      .setName('desafio_estado')
      .setDescription('Ver estado e prontidão do desafio')
      .toJSON(),
    new SlashCommandBuilder()
      .setName('desafio_ranking')
      .setDescription('Ver ranking do desafio')
      .addStringOption(option =>
        option
          .setName('ano')
          .setDescription('Filtrar por ano')
          .addChoices(
            { name: 'Todos', value: 'todos' },
            { name: '9.º ano', value: '9ano' },
            { name: '12.º ano', value: '12ano' },
          )
          .setRequired(false)
      )
      .addIntegerOption(option =>
        option
          .setName('limite')
          .setDescription('Número de posições (1-20)')
          .setMinValue(1)
          .setMaxValue(20)
          .setRequired(false)
      )
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

    // Setup #cronogramas (9º ano) channel (2 messages: info + action)
    const cronogramas9AnoChannel = await client.channels.fetch(config.cronogramas9AnoChannelId) as TextChannel;
    if (cronogramas9AnoChannel) {
      const infoEmbed9Ano = createCronogramas9AnoInfoEmbed();
      await cronogramas9AnoChannel.send({ embeds: [infoEmbed9Ano] });

      const { embed, row } = createCronogramas9AnoEmbed();
      await cronogramas9AnoChannel.send({ embeds: [embed], components: [row] });
      console.log('Mensagens enviadas para #cronogramas (9º ano)');
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

      if (interaction.commandName === 'nivel') {
        await handleNivelCommand(interaction);
        return;
      }

      if (interaction.commandName === 'xp') {
        await handleXpCommand(interaction);
        return;
      }

      if (interaction.commandName === 'ranking') {
        await handleRankingCommand(interaction);
        return;
      }

      if (interaction.commandName === 'desafio_configurar') {
        await handleChallengeConfigureCommand(interaction);
        return;
      }
      if (interaction.commandName === 'desafio_importar_perguntas') {
        await handleChallengeImportQuestionsCommand(interaction);
        return;
      }
      if (interaction.commandName === 'desafio_definir_gabarito') {
        await handleChallengeSetAnswerKeyCommand(interaction);
        return;
      }
      if (interaction.commandName === 'desafio_agendar') {
        await handleChallengeScheduleCommand(interaction);
        return;
      }
      if (interaction.commandName === 'desafio_iniciar_agora') {
        await handleChallengeStartNowCommand(interaction);
        return;
      }
      if (interaction.commandName === 'desafio_pausar') {
        await handleChallengePauseCommand(interaction);
        return;
      }
      if (interaction.commandName === 'desafio_estado') {
        await handleChallengeStateCommand(interaction);
        return;
      }
      if (interaction.commandName === 'desafio_ranking') {
        await handleChallengeRankingCommand(interaction);
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
      if (customId === 'year_79') {
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
      if (customId === 'start_cronograma_9ano') {
        await handleStartCronograma9Ano(interaction);
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

      if (customId.startsWith('challenge_answer:')) {
        await handleChallengeAnswerButton(interaction);
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

client.on(Events.ThreadCreate, async (thread) => {
  try {
    await handleDoubtsThreadCreated(thread);
  } catch (error) {
    console.error('Erro no sistema de níveis (thread criada):', error);
  }
});

client.on(Events.MessageCreate, async (message) => {
  try {
    await handleDoubtsThreadMessage(message);
  } catch (error) {
    console.error('Erro no sistema de níveis (mensagem):', error);
  }
});

client.on(Events.GuildMemberAdd, async (member) => {
  try {
    await handleChallengeMemberJoin(member);
  } catch (error) {
    console.error('Erro no sistema de desafio (entrada):', error);
  }
});

client.on(Events.GuildMemberRemove, async (member) => {
  try {
    await handleChallengeMemberLeave(member);
  } catch (error) {
    console.error('Erro no sistema de desafio (saída):', error);
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
  await verifyLevelSystemTable();

  const guild = await client.guilds.fetch(config.guildId).catch(() => null);
  if (guild) {
    await bootstrapLevelRoles(guild);
  } else {
    console.log('Não foi possível carregar o servidor para criar cargos de níveis automaticamente.');
  }

  await bootstrapChallengeSystem(client);
  
  console.log('Bot pronto para receber interações!');
});

// Start the bot
console.log('A iniciar bot Discord...');
client.login(config.discordToken);
