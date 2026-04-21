import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } from 'discord.js';
import { config, LESSON_PRICE_CENTS } from '../config';
import path from 'path';

// Colors (black/white theme)
const EMBED_COLOR = 0xffffff; // White for embed sidebar
const SUCCESS_COLOR = 0x22c55e; // Green for success
const ERROR_COLOR = 0xef4444; // Red for errors

// Custom thumbnail URLs (hosted on site)
const EXPLICACOES_THUMBNAIL = `${config.siteUrl}/discord/explicacoes.png`;
const CRONOGRAMAS_THUMBNAIL = `${config.siteUrl}/discord/cronogramas.png`;

// Create info embed for #explicacoes channel (first message - informational)
export function createExplicacoesInfoEmbed() {
  const embed = new EmbedBuilder()
    .setColor(EMBED_COLOR)
    .setTitle('📖 Explicações Individuais')
    .setDescription(
      '**Precisas de ajuda com a matéria?**\n' +
      '**As aulas não são suficientes para perceber tudo?**\n' +
      '**Queres um acompanhamento personalizado?**\n\n' +
      'Marca uma explicação individual com o Alin e esclarece as tuas dúvidas!\n\n' +
      '━━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
      '**Como funciona?**\n' +
      '• Depois de a explicação ser marcada, o Alin prepara a aula\n' +
      '• A explicação é dada em chamada no Discord em conjunto com a plataforma **Miro**\n' +
      '• Todos os materiais ficam guardados na aba **"Minhas aulas"** no site [matematica.top](https://matematica.top/)\n\n' +
      '**Desmarcações**\n' +
      'Surgiu um imprevisto? Entra em contacto o mais rápido possível!\n' +
      '• Avisa com pelo menos **1 hora de antecedência**'
    )
    .setFooter({ text: 'MatemáticaTop © 2026 | matematica.top' });

  return embed;
}

// Create action embed for #explicacoes channel (second message - with button)
export function createExplicacoesEmbed() {
  const embed = new EmbedBuilder()
    .setColor(EMBED_COLOR)
    .setTitle('🎯 Pronto para começar?')
    .setDescription(
      'Clica no botão abaixo para agendar a tua explicação.\n\n' +
      'Para mais informações, consulta [matematica.top/marcar](https://matematica.top/marcar)'
    )
    .setFooter({ text: 'MatemáticaTop © 2026 | matematica.top' });

  const row = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('start_booking')
        .setLabel('Marcar Explicação')
        .setStyle(ButtonStyle.Primary)
    );

  return { embed, row };
}

// Create info embed for #cronogramas channel (first message - informational)
export function createCronogramasInfoEmbed() {
  const embed = new EmbedBuilder()
    .setColor(EMBED_COLOR)
    .setTitle('📋 Cronogramas')
    .setDescription(
      '**Não sabes como te preparar para o exame?**\n' +
      '**Precisas de um plano de estudo organizado?**\n' +
      '**Sentes que o tempo está a passar e não tens uma estratégia?**\n\n' +
      'O Alin preparou cronogramas personalizados para te ajudar a organizar o estudo para o **Exame Nacional**!\n\n' +
      '━━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
      '**O que são os cronogramas e como funcionam?**\n' +
      '• Planos de preparação para o exame com os temas organizados por semanas\n' +
      '• Adaptados ao tempo que tens disponível para estudar (de **2 semanas** a **3 meses**)\n' +
      '• Focam-se nos temas em que tens mais dificuldade\n\n' +
      '**Como usar?**\n' +
      '• Segue o plano semana a semana\n' +
      '• Estuda cada tema na ordem indicada\n' +
      '• Chega ao exame com tudo revisto!'
    )
    .setFooter({ text: 'MatemáticaTop © 2026 | matematica.top' });

  return embed;
}

// Create action embed for #cronogramas channel (second message - with button)
export function createCronogramasEmbed() {
  const embed = new EmbedBuilder()
    .setColor(EMBED_COLOR)
    .setTitle('🎯 Acede já ao teu cronograma')
    .setDescription('Clica no botão abaixo para gerar o teu plano de estudo personalizado.')
    .setFooter({ text: 'MatemáticaTop © 2026 | matematica.top' });

  const row = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('start_cronograma')
        .setLabel('Ver Cronograma')
        .setStyle(ButtonStyle.Primary)
    );

  return { embed, row };
}

// Create info embed for #cronogramas (9º ano) channel (first message - informational)
export function createCronogramas9AnoInfoEmbed() {
  const embed = new EmbedBuilder()
    .setColor(EMBED_COLOR)
    .setTitle('📋 Cronogramas')
    .setDescription(
      '**Não sabes como te preparar para o exame?**\n' +
      '**Precisas de um plano de estudo organizado?**\n' +
      '**Sentes que o tempo está a passar e não tens uma estratégia?**\n\n' +
      'O Alin preparou cronogramas personalizados para te ajudar a organizar o estudo para o **Exame Nacional**!\n\n' +
      '━━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
      '**O que são os cronogramas e como funcionam?**\n' +
      '• Planos de preparação para o exame com os temas organizados por semanas\n' +
      '• Adaptados ao tempo que tens disponível para estudar (de **2 semanas** a **2 meses**)\n' +
      '• Focam-se nos temas em que tens mais dificuldade\n\n' +
      '**Como usar?**\n' +
      '• Segue o plano semana a semana\n' +
      '• Estuda cada tema na ordem indicada\n' +
      '• Chega ao exame com tudo revisto!'
    )
    .setFooter({ text: 'MatemáticaTop © 2026 | matematica.top' });

  return embed;
}

// Create action embed for #cronogramas (9º ano) channel (second message - with button)
export function createCronogramas9AnoEmbed() {
  const embed = new EmbedBuilder()
    .setColor(EMBED_COLOR)
    .setTitle('🎯 Acede já ao teu cronograma')
    .setDescription('Clica no botão abaixo para gerar o teu plano de estudo personalizado.')
    .setFooter({ text: 'MatemáticaTop © 2026 | matematica.top' });

  const row = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('start_cronograma_9ano')
        .setLabel('Ver Cronograma')
        .setStyle(ButtonStyle.Primary)
    );

  return { embed, row };
}

// Create welcome embed for #o-que-sai-nos-exames channel
export function createExamTopicsEmbed() {
  const embed = new EmbedBuilder()
    .setColor(EMBED_COLOR)
    .setTitle('📊 O que sai nos exames')
    .setDescription(
      'Descobre quais os temas que **mais saem nos exames** de Matemática A.\n\n' +
      'Clica no botão abaixo para consultar a frequência de cada tema nos exames de 2016 a 2025.\n\n' +
      '⚠️ *Apesar de alguns temas serem mais frequentes, não deixes de estudar os restantes! ' +
      'Todos os temas podem sair no exame.*'
    )
    .setFooter({ text: 'MatemáticaTop © 2026 | matematica.top' });

  const row = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('start_exam_topics')
        .setLabel('Escolher tema')
        .setStyle(ButtonStyle.Primary)
    );

  return { embed, row };
}

// Create registration required embed
export function createNeedsAuthEmbed() {
  const embed = new EmbedBuilder()
    .setColor(EMBED_COLOR)
    .setTitle('Autenticação necessária')
    .setDescription('Precisas de criar conta ou fazer login para continuar.')
    .setFooter({ text: 'MatemáticaTop © 2026 | matematica.top' });

  const row = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('show_register')
        .setLabel('Criar conta')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('show_login')
        .setLabel('Fazer login')
        .setStyle(ButtonStyle.Secondary)
    );

  return { embed, row };
}

// Create year selection embed for booking
export function createYearSelectionEmbed() {
  const embed = new EmbedBuilder()
    .setColor(EMBED_COLOR)
    .setTitle('📖 Marcar explicação')
    .setDescription('Seleciona o teu ano escolar.')
    .setFooter({ text: 'MatemáticaTop © 2026 | matematica.top' });

  const row = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('year_79')
        .setLabel('7º-9º')
        .setStyle(ButtonStyle.Secondary)
    );

  return { embed, row };
}

// Format price in euros
export function formatPrice(cents: number): string {
  return `${(cents / 100).toFixed(2).replace('.', ',')}€`;
}

// Create booking confirmation embed
export function createBookingConfirmEmbed(data: {
  year: string;
  topic: string;
  date: string;
  timeSlot: string;
  canPayInPerson: boolean;
}) {
  // Format date in Portuguese
  const dateObj = new Date(data.date);
  const months = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const formattedDate = `${dateObj.getDate()} de ${months[dateObj.getMonth()]} de ${dateObj.getFullYear()}`;
  
  // Format time slot
  const [start, end] = data.timeSlot.split('-');
  const startShort = start?.trim().slice(0, 5) || start;
  const endShort = end?.trim().slice(0, 5) || end;
  const formattedTime = `${startShort} - ${endShort}`;

  const embed = new EmbedBuilder()
    .setColor(EMBED_COLOR)
    .setTitle('📖 Confirmar marcação')
    .addFields(
      { name: 'Disciplina', value: 'Matemática', inline: true },
      { name: 'Ano', value: data.year, inline: true },
      { name: 'Tema', value: data.topic, inline: true },
      { name: 'Data', value: formattedDate, inline: true },
      { name: 'Horário', value: formattedTime, inline: true },
      { name: 'Preço', value: formatPrice(LESSON_PRICE_CENTS), inline: true }
    )
    .setFooter({ text: 'MatemáticaTop © 2026 | matematica.top' });

  const buttons = [
    new ButtonBuilder()
      .setCustomId('pay_online')
      .setLabel('Pagar Online')
      .setStyle(ButtonStyle.Success)
  ];

  if (data.canPayInPerson) {
    buttons.push(
      new ButtonBuilder()
        .setCustomId('pay_in_person')
        .setLabel('Pagar Presencialmente')
        .setStyle(ButtonStyle.Secondary)
    );
  }

  buttons.push(
    new ButtonBuilder()
      .setCustomId('cancel_booking')
      .setLabel('Cancelar')
      .setStyle(ButtonStyle.Danger)
  );

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(buttons);

  return { embed, row };
}

// Create booking success embed
export function createBookingSuccessEmbed(data: {
  date: string;
  timeSlot: string;
  paymentMethod: 'online' | 'in_person';
  stripeUrl?: string;
}) {
  // Format date
  const dateObj = new Date(data.date);
  const months = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const formattedDate = `${dateObj.getDate()} de ${months[dateObj.getMonth()]}`;
  
  const [start, end] = data.timeSlot.split('-');
  const startShort = start?.trim().slice(0, 5) || start;
  const endShort = end?.trim().slice(0, 5) || end;
  const formattedTime = `${startShort} - ${endShort}`;

  const embed = new EmbedBuilder()
    .setColor(SUCCESS_COLOR)
    .setTitle('✅ Marcação criada!')
    .setDescription(
      data.paymentMethod === 'online'
        ? `A tua explicação foi marcada para **${formattedDate}** às **${formattedTime}**.\n\nClica no botão abaixo para efetuar o pagamento.`
        : `A tua explicação foi marcada para **${formattedDate}** às **${formattedTime}**.\n\nO pagamento será feito presencialmente antes da aula.`
    )
    .setFooter({ text: 'MatemáticaTop © 2026 | matematica.top' });

  if (data.paymentMethod === 'online' && data.stripeUrl) {
    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setLabel('Pagar Agora')
          .setStyle(ButtonStyle.Link)
          .setURL(data.stripeUrl)
      );
    return { embed, row };
  }

  return { embed, row: null };
}

// Create error embed
export function createErrorEmbed(message: string) {
  const embed = new EmbedBuilder()
    .setColor(ERROR_COLOR)
    .setTitle('❌ Erro')
    .setDescription(message)
    .setFooter({ text: 'MatemáticaTop © 2026 | matematica.top' });

  return embed;
}

// Create login instructions embed
export function createLoginInstructionsEmbed(token: string) {
  const embed = new EmbedBuilder()
    .setColor(EMBED_COLOR)
    .setTitle('📧 Email enviado!')
    .setDescription(
      `Foi enviado um email com o link de autenticação.\n\n` +
      `Verifica a tua caixa de entrada e clica no botão abaixo quando tiveres verificado.`
    )
    .setFooter({ text: 'O link expira em 15 minutos.' });

  const row = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`verify_login_${token}`)
        .setLabel('Já verifiquei o email')
        .setStyle(ButtonStyle.Primary)
    );

  return { embed, row };
}

// Create registration success embed
export function createRegistrationSuccessEmbed() {
  const embed = new EmbedBuilder()
    .setColor(SUCCESS_COLOR)
    .setTitle('✅ Conta criada com sucesso!')
    .setDescription('Agora podes marcar explicações e aceder aos cronogramas.')
    .setFooter({ text: 'MatemáticaTop © 2026 | matematica.top' });

  return embed;
}

// Create cronograma result embed with PDF
export function getCronogramaFilePath(studyStart: string, difficultyTopic: string): string {
  // For 2 semanas, there's only one cronograma (no topic)
  if (studyStart === '2s') {
    return path.join(__dirname, '../../..', 'public', 'cronogramas', 'cronograma_2s.pdf');
  }
  // Map the values to file names
  const fileName = `cronograma_${studyStart}_${difficultyTopic}.pdf`;
  return path.join(__dirname, '../../..', 'public', 'cronogramas', fileName);
}

export function createCronogramaResultEmbed(studyStart: string, difficultyTopic: string) {
  const studyStartLabels: Record<string, string> = {
    '3m': '3 meses antes',
    '2m': '2 meses antes',
    '1m': '1 mês antes',
    '2s': '2 semanas antes',
  };

  const difficultyLabels: Record<string, string> = {
    'funcoes': 'Funções',
    'geometria': 'Geometria',
    'trigo': 'Trigonometria',
    'prob_comb': 'Probabilidades e combinatória',
    'sucessoes': 'Sucessões',
    'complexos': 'Números complexos',
  };

  const embed = new EmbedBuilder()
    .setColor(SUCCESS_COLOR)
    .setTitle('📋 O teu cronograma')
    .setDescription('Aqui está o teu plano de preparação personalizado para o exame.');
  
  // Add fields based on whether topic exists (2s has no topic)
  if (studyStart === '2s') {
    embed.addFields(
      { name: 'Início do estudo', value: studyStartLabels[studyStart] || studyStart, inline: true }
    );
  } else {
    embed.addFields(
      { name: 'Início do estudo', value: studyStartLabels[studyStart] || studyStart, inline: true },
      { name: 'Tema prioritário', value: difficultyLabels[difficultyTopic] || difficultyTopic, inline: true }
    );
  }
  
  embed.setFooter({ text: 'MatemáticaTop © 2026 | matematica.top' });

  return embed;
}

export function getCronograma9AnoFilePath(studyStart: string, difficultyTopic: string): string {
  if (studyStart === '2s') {
    return path.join(__dirname, '../../..', 'public', 'cronogramas', 'cronograma_9ano_2s.pdf');
  }
  const fileName = `cronograma_9ano_${studyStart}_${difficultyTopic}.pdf`;
  return path.join(__dirname, '../../..', 'public', 'cronogramas', fileName);
}

export function createCronograma9AnoResultEmbed(studyStart: string, difficultyTopic: string) {
  const studyStartLabels: Record<string, string> = {
    '2m': '2 meses antes',
    '1m': '1 mês antes',
    '2s': '2 semanas antes',
  };

  const difficultyLabels: Record<string, string> = {
    'nreais': 'Números reais',
    'algebra': 'Álgebra',
    'geo': 'Geometria',
    'dados': 'Probabilidades e estatística',
  };

  const studyLabel = studyStartLabels[studyStart] || studyStart;
  const difficultyLabel = difficultyLabels[difficultyTopic] || difficultyTopic;
  const summary =
    studyStart === '2s'
      ? `Início do estudo: ${studyLabel}`
      : `Início do estudo: ${studyLabel} | Tema prioritário: ${difficultyLabel}`;

  const embed = new EmbedBuilder()
    .setColor(SUCCESS_COLOR)
    .setTitle('📋 O teu cronograma')
    .setDescription(`Aqui está o teu plano de preparação personalizado para o exame:\n\n"${summary}"`);

  if (studyStart === '2s') {
    embed.addFields({ name: 'Início do estudo', value: studyLabel, inline: true });
  } else {
    embed.addFields(
      { name: 'Início do estudo', value: studyLabel, inline: true },
      { name: 'Tema prioritário', value: difficultyLabel, inline: true }
    );
  }

  embed.setFooter({ text: 'MatemáticaTop © 2026 | matematica.top' });
  return embed;
}
