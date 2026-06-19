export type BookingMode = 'individual' | 'group';

export type BookingMeta = {
  mode: BookingMode;
  groupId: string | null;
  hostId: string;
  size: number;
  participants: string[];
};

const META_PREFIX = '[BOOKING_META';

export function getInviteCodeFromUserId(userId: string): string {
  return `MET-${userId.replace(/-/g, '').slice(0, 8).toUpperCase()}`;
}

export function normalizeInviteCode(code: string): string {
  return code.trim().toUpperCase();
}

/** Preço individual predefinido (Alin), em cêntimos por hora. */
export const DEFAULT_INDIVIDUAL_PRICE_CENTS = 1900;

/**
 * Preço por aluno predefinido para 2 alunos (em cêntimos). Partilhado por quase
 * todos os explicadores; alguns podem ter o seu próprio valor (ex.: Manuel, 15€).
 */
export const DEFAULT_TWO_STUDENT_PRICE_CENTS = 1200;

/**
 * Preço da 1.ª aula de cada aluno (em cêntimos). A primeira explicação individual
 * de um aluno tem sempre este valor de boas-vindas; a partir daí passa a ser o
 * preço individual normal do explicador (ou o valor combinado à parte por MBWay).
 */
export const FIRST_LESSON_PRICE_CENTS = 1000;

/**
 * Interruptor global da promoção de 1.ª aula a 10€. Está DESLIGADA: a promoção
 * terminou devido à elevada procura e à proximidade dos exames, por isso a
 * primeira aula passa a custar o preço individual normal do explicador.
 * Para a reativar no futuro, basta voltar a pôr `true`.
 */
export const FIRST_LESSON_PROMO_ENABLED = false;

/**
 * Preço por aluno (em cêntimos) consoante o tamanho do grupo. O preço individual
 * (1 aluno) e o preço de 2 alunos podem variar por explicador; os restantes
 * preços de grupo (3, 4, 5+) são partilhados.
 */
export function getPricePerStudentCents(
  groupSize: number,
  individualPriceCents: number = DEFAULT_INDIVIDUAL_PRICE_CENTS,
  twoStudentPriceCents: number = DEFAULT_TWO_STUDENT_PRICE_CENTS,
): number {
  // O preço por aluno desce sempre, mas o total por hora sobe a cada aluno extra
  // (1→17, 2→24, 3→27, 4→28, 5+→30+), por isso os grupos pequenos têm preço por
  // número exato e só a partir de 5 alunos é que o valor estabiliza nos 6€.
  if (groupSize <= 1) return individualPriceCents;
  if (groupSize === 2) return twoStudentPriceCents;
  if (groupSize === 3) return 900;
  if (groupSize === 4) return 700;
  return 600;
}

export function formatEuroFromCents(cents: number): string {
  return `${(cents / 100).toFixed(2).replace('.', ',')}€`;
}

export function buildBookingMeta(meta: BookingMeta): string {
  const participantsPart = meta.participants.join(',');
  const groupValue = meta.groupId ?? 'none';
  return `${META_PREFIX} mode=${meta.mode} group=${groupValue} host=${meta.hostId} size=${meta.size} participants=${participantsPart}]`;
}

export function parseBookingMeta(observations: string | null | undefined): BookingMeta | null {
  if (!observations) return null;
  const firstLine = observations.split('\n')[0]?.trim();
  if (!firstLine || !firstLine.startsWith(META_PREFIX)) return null;

  const modeMatch = firstLine.match(/\bmode=(individual|group)\b/);
  const groupMatch = firstLine.match(/\bgroup=([^\s\]]+)\b/);
  const hostMatch = firstLine.match(/\bhost=([^\s\]]+)\b/);
  const sizeMatch = firstLine.match(/\bsize=(\d+)\b/);
  const participantsMatch = firstLine.match(/\bparticipants=([^\]]+)\b/);

  if (!modeMatch || !groupMatch || !hostMatch || !sizeMatch || !participantsMatch) {
    return null;
  }

  const participants = participantsMatch[1]
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  return {
    mode: modeMatch[1] as BookingMode,
    groupId: groupMatch[1] === 'none' ? null : groupMatch[1],
    hostId: hostMatch[1],
    size: Number(sizeMatch[1]),
    participants,
  };
}

export function stripBookingMeta(observations: string | null | undefined): string {
  if (!observations) return '';
  const lines = observations.split('\n');
  if (lines[0]?.startsWith(META_PREFIX)) {
    return lines.slice(1).join('\n').trim();
  }
  return observations.trim();
}

export function composeBookingObservations(meta: BookingMeta, notes: string): string {
  const cleanNotes = notes.trim();
  if (!cleanNotes) return buildBookingMeta(meta);
  return `${buildBookingMeta(meta)}\n${cleanNotes}`;
}
