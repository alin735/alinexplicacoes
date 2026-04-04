import dotenv from 'dotenv';
dotenv.config();

export const config = {
  // Discord
  discordToken: process.env.DISCORD_BOT_TOKEN!,
  guildId: process.env.DISCORD_GUILD_ID!,
  explicacoesChannelId: process.env.DISCORD_EXPLICACOES_CHANNEL_ID!,
  cronogramasChannelId: process.env.DISCORD_CRONOGRAMAS_CHANNEL_ID!,
  examTopicsChannelId: process.env.DISCORD_EXAM_TOPICS_CHANNEL_ID!,

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
  '10º': [
    'Modelos matemáticos para a cidadania',
    'Estatística',
    'Geometria sintética',
    'Funções',
    'Geometria analítica',
  ],
  '11º': [
    'Trigonometria',
    'Produto escalar',
    'Sucessões',
  ],
};

export const SCHOOL_YEARS = ['10º', '11º'] as const;

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

// Price in cents (individual lesson)
export const LESSON_PRICE_CENTS = 1300;
