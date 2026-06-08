import type { SchoolYear } from '@/lib/types';

// ─── Registo central de explicadores (centro de estudos MatemáticaTop) ────────
//
// Cada explicador tem um `id` (UID do Supabase Auth), um `slug` usado nos URLs
// públicos (/marcar?explicador=<slug>), o nome público a mostrar, o email para
// onde vão as notificações das marcações dele e a imagem do cartão de seleção.
//
// Para adicionar um novo explicador no futuro:
//   1. Acrescenta uma entrada a TUTORS com o UID, slug, nome, email e imagem.
//   2. Coloca a imagem do cartão em /public/images/marcar/.
//   3. (Base de dados) Não é preciso mais nada: os horários/marcações/aulas dele
//      ficam associados ao UID automaticamente.

export type Tutor = {
  /** UID do Supabase Auth (profiles.id). */
  id: string;
  /** Slug usado no URL público, ex.: 'alin'. */
  slug: string;
  /** Nome público a mostrar nos cartões e títulos. */
  name: string;
  /** Email para onde vão as notificações de marcações deste explicador. */
  email: string;
  /** Imagem do cartão de seleção (em /public). */
  cardImage: string;
  /**
   * Título usado no cartão de seleção e no topo da página de marcação,
   * ex.: 'Explicações com Alin' ou 'Explicações com o Luís'. Permite ajustar
   * a preposição de cada nome.
   */
  bookingTitle: string;
  /**
   * Preço da explicação individual (1 aluno), em cêntimos, por hora.
   * Os preços de grupo (3, 4, 5+ alunos) são partilhados entre explicadores.
   */
  individualPriceCents: number;
  /**
   * Preço por aluno para 2 alunos (em cêntimos). Opcional: quando ausente, usa
   * o valor partilhado (DEFAULT_TWO_STUDENT_PRICE_CENTS, 12€). O Manuel tem 15€.
   */
  twoStudentPriceCents?: number;
  /**
   * Anos escolares que este explicador leciona (aparecem no seletor de ano da
   * página de marcação). Permite, por exemplo, que só o Luís dê 12º ano.
   */
  schoolYears: SchoolYear[];
  /**
   * Token secreto e não adivinhável que dá acesso ao link privado de marcação
   * deste explicador (/marcar?explicador=<accessToken>). Cada explicador recebe
   * apenas o seu link, por isso não conseguem aceder aos links uns dos outros.
   * Para revogar/rodar o link de um explicador, basta gerar um novo token aqui.
   */
  accessToken: string;
  /** O explicador "principal" (Alin). Recebe sempre cópia das notificações. */
  isPrimary?: boolean;
  /**
   * Se a 1.ª explicação individual de cada aluno tem o preço de boas-vindas
   * (FIRST_LESSON_PRICE_CENTS, 10€). Predefinição: true. O Manuel não faz a
   * 1.ª aula com desconto, por isso fica `false` e a primeira aula dele é logo
   * o preço individual normal (18€).
   */
  firstLessonDiscount?: boolean;
};

export const TUTORS: Tutor[] = [
  {
    id: '29bb0035-5cb7-44b7-b6d8-4c04fd378fb9',
    slug: 'alin',
    name: 'Alin',
    email: 'alincmat29@gmail.com',
    cardImage: '/images/marcar/explicador-alin-card.png',
    bookingTitle: 'Explicações com Alin',
    individualPriceCents: 1900,
    schoolYears: ['7º-9º', '10º', '11º'],
    accessToken: 'qKCiMqW5GFxvO-qW',
    isPrimary: true,
  },
  {
    id: 'be20573e-4c43-4fce-8247-52be8112ca24',
    slug: 'luis',
    name: 'Luís',
    email: 'trickzzypt@gmail.com',
    cardImage: '/images/marcar/explicador-luis-card.png',
    bookingTitle: 'Explicações com o Luís',
    individualPriceCents: 1700,
    schoolYears: ['7º-9º', '10º', '11º', '12º', 'Preparação para Exame'],
    accessToken: 'ZqUdEjdma9LUW2il',
  },
  {
    id: '9b1dc1e4-fb0b-43d4-a83a-a63047ec53d6',
    slug: 'andre',
    name: 'André',
    email: 'andrepereira3414@gmail.com',
    cardImage: '/images/marcar/explicador-andre-card.png',
    bookingTitle: 'Explicações com o André',
    individualPriceCents: 1700,
    schoolYears: ['7º-9º', '10º', '11º', '12º', 'Preparação para Exame'],
    accessToken: 'Sy0kjuagTFOq9Lu9',
  },
  {
    id: '6ccf6fc1-41c4-4470-abac-21becca2ac61',
    slug: 'manuel',
    name: 'Manuel',
    email: 'manuelpiresferreira@gmail.com',
    cardImage: '/images/marcar/explicador-manuel-card.png',
    bookingTitle: 'Explicações com o Manuel',
    individualPriceCents: 1800,
    twoStudentPriceCents: 1500,
    schoolYears: ['7º-9º', '10º', '11º', '12º', 'Preparação para Exame'],
    accessToken: 'hV8rXmPq2LkNwZ4t',
    firstLessonDiscount: false,
  },
  {
    id: '14666939-f602-4df5-9039-76ddd8e6655c',
    slug: 'lisandro',
    name: 'Lisandro',
    email: 'lisandroshystar@gmail.com',
    cardImage: '/images/marcar/explicador-lisandro-card.png',
    bookingTitle: 'Explicações com o Lisandro',
    individualPriceCents: 1800,
    schoolYears: ['7º-9º', '10º', '11º', '12º', 'Preparação para Exame'],
    accessToken: 'pY3nKd9LtRa6QvWx',
  },
];

/**
 * True se a 1.ª explicação individual de um aluno deste explicador tem o preço
 * de boas-vindas (10€). Por predefinição é true; só fica false se o explicador
 * tiver `firstLessonDiscount: false` (ex.: Manuel).
 */
export function tutorOffersFirstLessonDiscount(tutor: Pick<Tutor, 'firstLessonDiscount'>): boolean {
  return tutor.firstLessonDiscount !== false;
}

/** O explicador principal (Alin) — usado como predefinição quando não há slug. */
export function getDefaultTutor(): Tutor {
  return TUTORS.find((t) => t.isPrimary) ?? TUTORS[0];
}

export function getTutorBySlug(slug: string | null | undefined): Tutor | null {
  if (!slug) return null;
  return TUTORS.find((t) => t.slug === slug) ?? null;
}

export function getTutorById(id: string | null | undefined): Tutor | null {
  if (!id) return null;
  return TUTORS.find((t) => t.id === id) ?? null;
}

/**
 * Resolve o token secreto do link privado para o explicador correspondente.
 * Usado em /marcar?explicador=<accessToken> para abrir a marcação já bloqueada
 * nesse explicador, sem expor os links dos outros.
 */
export function getTutorByAccessToken(token: string | null | undefined): Tutor | null {
  if (!token) return null;
  return TUTORS.find((t) => t.accessToken === token) ?? null;
}

/** True se o UID corresponde a um explicador (para mostrar a área de Explicador). */
export function isTutorId(id: string | null | undefined): boolean {
  return Boolean(getTutorById(id));
}

/**
 * Resolve um slug para um explicador, caindo no explicador principal quando o
 * slug é inválido ou ausente. Útil para o fluxo público de marcação.
 */
export function resolveTutorOrDefault(slug: string | null | undefined): Tutor {
  return getTutorBySlug(slug) ?? getDefaultTutor();
}
