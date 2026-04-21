import dotenv from 'dotenv';
dotenv.config();

function parseUserIdList(value: string | undefined): string[] {
  return (value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export const config = {
  // Discord
  discordToken: process.env.DISCORD_BOT_TOKEN!,
  guildId: process.env.DISCORD_GUILD_ID!,
  explicacoesChannelId: process.env.DISCORD_EXPLICACOES_CHANNEL_ID!,
  cronogramasChannelId: process.env.DISCORD_CRONOGRAMAS_CHANNEL_ID!,
  cronogramas9AnoChannelId:
    process.env.DISCORD_9ANO_CRONOGRAMAS_CHANNEL_ID || '1494387793713959114',
  doubtsChannelId: process.env.DISCORD_DOUBTS_CHANNEL_ID || '1487542864811393136',
  levelUpChannelId: process.env.DISCORD_LEVEL_UP_CHANNEL_ID || '1495076712915140688',
  xpExcludedUserIds: parseUserIdList(
    process.env.DISCORD_XP_EXCLUDED_USER_IDS || '1013149135127453798',
  ),
  examTopicsChannelId: process.env.DISCORD_EXAM_TOPICS_CHANNEL_ID!,
  challenge9ChannelId: process.env.DISCORD_CHALLENGE_9ANO_CHANNEL_ID || '',
  challenge12ChannelId: process.env.DISCORD_CHALLENGE_12ANO_CHANNEL_ID || '',
  challengeLeaderboardChannelId: process.env.DISCORD_CHALLENGE_LEADERBOARD_CHANNEL_ID || '',
  challengeQuestions9Path: process.env.DISCORD_CHALLENGE_QUESTIONS_9ANO_PATH || '',
  challengeQuestions12Path: process.env.DISCORD_CHALLENGE_QUESTIONS_12ANO_PATH || '',

  // Supabase
  supabaseUrl: process.env.SUPABASE_URL!,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,

  // Stripe
  stripeSecretKey: process.env.STRIPE_SECRET_KEY!,

  // Email
  resendApiKey: process.env.RESEND_API_KEY!,
  resendFromEmail: process.env.RESEND_FROM_EMAIL || 'MatemáticaTop <noreply@contacto.matematica.top>',

  // Site
  siteUrl: process.env.SITE_URL || 'https://matematica.top',
};

// Emails that can pay in person
export const IN_PERSON_PAYMENT_EMAILS = [
  'paula.magana6@gmail.com',
  'maxfariabolotinha@gmail.com',
  'poisonsb1@gmail.com',
  'gregoryeleuterio8@gmail.com',
  'dubrovadavid1@gmail.com',
  'flo.gologan@gmail.com',
  'alincmat29@gmail.com',
  'alinciorba29@gmail.com',
].map(e => e.toLowerCase());

// Math topics by school year
export const MATH_TOPICS_BY_YEAR: Record<string, string[]> = {
  '7º-9º': [
    'Número reais',
    'Geometria',
    'Álgebra',
    'Probabilidades e estatística',
  ],
};

export const SCHOOL_YEARS = ['7º-9º'] as const;

// Cronograma options
export const STUDY_START_OPTIONS = [
  { label: '3 meses antes', value: '3m' },
  { label: '2 meses antes', value: '2m' },
  { label: '1 mês antes', value: '1m' },
  { label: '2 semanas antes', value: '2s' },
] as const;

export const DIFFICULTY_TOPICS = [
  { label: 'Funções', value: 'funcoes' },
  { label: 'Geometria', value: 'geometria' },
  { label: 'Trigonometria', value: 'trigo' },
  { label: 'Probabilidades e combinatória', value: 'prob_comb' },
  { label: 'Sucessões', value: 'sucessoes' },
  { label: 'Números complexos', value: 'complexos' },
] as const;

export const STUDY_START_OPTIONS_9ANO = [
  { label: '2 semanas antes', value: '2s' },
  { label: '1 mês antes', value: '1m' },
  { label: '2 meses antes', value: '2m' },
] as const;

export const DIFFICULTY_TOPICS_9ANO = [
  { label: 'Números reais', value: 'nreais' },
  { label: 'Álgebra', value: 'algebra' },
  { label: 'Geometria', value: 'geo' },
  { label: 'Probabilidades e estatística', value: 'dados' },
] as const;

// Price in cents (individual lesson)
export const LESSON_PRICE_CENTS = 1300;
