export const GROUP_CLASS_SCHOOL_YEAR = '9ano' as const;
export const GROUP_CLASS_EXAM_DATE = '2026-06-22';

export type GroupClassPackageId = 'completo' | 'intermedio' | 'avulsa';

export type GroupClassPackage = {
  id: GroupClassPackageId;
  title: string;
  badge: string;
  priceCents: number;
  priceLabel: string;
  originalPriceLabel?: string;
  cta: string;
  stripeName: string;
  stripeDescription: string;
  highlighted?: boolean;
  tagline?: string;
  features: string[];
  exclusions: string[];
};

export const GROUP_CLASS_PACKAGES: Record<GroupClassPackageId, GroupClassPackage> = {
  completo: {
    id: 'completo',
    title: 'Pacote Completo',
    badge: 'Mais vantajoso',
    priceCents: 10000,
    priceLabel: '100€',
    originalPriceLabel: '180€',
    cta: 'Reservar vaga completa',
    stripeName: 'Pacote Completo - Preparação Intensiva 9.º Ano',
    stripeDescription:
      '15 aulas ao vivo na Skool, gravações, materiais, WhatsApp e acesso vitalício à Skool da MatemáticaTop.',
    highlighted: true,
    tagline: 'O acesso mais completo à preparação, com suporte direto e garantia de satisfação incluída.',
    features: [
      '15 aulas ao vivo até ao exame',
      'Gravações de todas as aulas',
      'Materiais desta preparação',
      'Aulas ao vivo na Skool',
      'Apoio por WhatsApp',
      'Acesso vitalício à Skool (29€/mês a partir de setembro)',
    ],
    exclusions: [],
  },
  intermedio: {
    id: 'intermedio',
    title: 'Pacote Intermédio',
    badge: 'Flexível',
    priceCents: 6500,
    priceLabel: '65€',
    cta: 'Escolher 7 aulas',
    stripeName: 'Pacote Intermédio - Preparação Intensiva 9.º Ano',
    stripeDescription:
      '7 aulas à escolha na Skool, gravações e materiais dessas aulas, acesso à Skool durante o programa.',
    features: [
      '7 aulas à escolha',
      'Gravações dessas aulas',
      'Materiais dessas aulas',
      'Aulas ao vivo na Skool',
      'Acesso à Skool durante o programa',
    ],
    exclusions: [
      'Sem apoio por WhatsApp',
      'Sem acesso vitalício à Skool',
    ],
  },
  avulsa: {
    id: 'avulsa',
    title: 'Aula Avulsa',
    badge: 'Entrada rápida',
    priceCents: 1200,
    priceLabel: '12€',
    cta: 'Comprar aula avulsa',
    stripeName: 'Aula Avulsa - Preparação Intensiva 9.º Ano',
    stripeDescription:
      '1 aula, gravação dessa aula e materiais correspondentes.',
    features: [
      '1 aula',
      'Gravação dessa aula',
      'Materiais dessa aula',
    ],
    exclusions: [
      'Sem acesso contínuo à Skool',
      'Sem apoio por WhatsApp',
      'Sem acesso completo ao programa',
    ],
  },
};

export function getGroupClassPackage(packageId: string | null | undefined) {
  if (!packageId) return null;
  return GROUP_CLASS_PACKAGES[packageId as GroupClassPackageId] ?? null;
}

export type GroupClassLesson = {
  id: number;
  date: string;
  time: string;
  topic: string;
};

export const GROUP_CLASS_LESSONS: GroupClassLesson[] = [
  { id: 1,  date: '2026-05-28', time: '18h30', topic: 'Intervalos de números reais' },
  { id: 2,  date: '2026-05-29', time: '18h30', topic: 'Dízimas' },
  { id: 3,  date: '2026-05-30', time: '15h00', topic: 'Notação científica' },
  { id: 4,  date: '2026-05-31', time: '15h00', topic: 'Sequências' },
  { id: 5,  date: '2026-06-01', time: '18h30', topic: 'Áreas e volumes' },
  { id: 6,  date: '2026-06-02', time: '18h30', topic: 'Teorema de Pitágoras' },
  { id: 7,  date: '2026-06-03', time: '18h30', topic: 'Semelhança de triângulos' },
  { id: 8,  date: '2026-06-05', time: '18h30', topic: 'Trigonometria' },
  { id: 9,  date: '2026-06-06', time: '15h00', topic: 'Circunferência' },
  { id: 10, date: '2026-06-07', time: '15h00', topic: 'Equações e Inequações do 1.º grau' },
  { id: 11, date: '2026-06-08', time: '18h30', topic: 'Equações do 2.º grau' },
  { id: 12, date: '2026-06-09', time: '18h30', topic: 'Função afim' },
  { id: 13, date: '2026-06-10', time: '18h30', topic: 'Função quadrática e de proporcionalidade inversa' },
  { id: 14, date: '2026-06-13', time: '15h00', topic: 'Probabilidades' },
  { id: 15, date: '2026-06-14', time: '15h00', topic: 'Estatística' },
];

