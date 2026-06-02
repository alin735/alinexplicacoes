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
   * Os preços de grupo (2 alunos, 3+ alunos) são partilhados entre explicadores.
   */
  individualPriceCents: number;
  /**
   * Anos escolares que este explicador leciona (aparecem no seletor de ano da
   * página de marcação). Permite, por exemplo, que só o Luís dê 12º ano.
   */
  schoolYears: SchoolYear[];
  /** O explicador "principal" (Alin). Recebe sempre cópia das notificações. */
  isPrimary?: boolean;
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
    schoolYears: ['7º-9º', '10º', '11º', '12º'],
  },
];

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
