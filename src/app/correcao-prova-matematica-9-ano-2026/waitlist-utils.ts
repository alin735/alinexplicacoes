// Opções de curso do secundário mostradas na lista de espera das Explicações Top.
export const COURSES = [
  'Línguas e Humanidades',
  'Ciências e Tecnologias',
  'Ciências Socioeconómicas',
  'Artes Visuais',
  'Cursos Profissionais',
  'Outro',
];

// Marca, neste dispositivo, que a pessoa já entrou na lista de espera.
// Enquanto este sinal existir, não voltamos a pedir a inscrição.
const WAITLIST_FLAG = 'mt_explicacoes_top_waitlist';

export function hasJoinedWaitlist(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(WAITLIST_FLAG) === 'true';
  } catch {
    return false;
  }
}

export function markJoinedWaitlist() {
  try {
    window.localStorage.setItem(WAITLIST_FLAG, 'true');
  } catch {
    // Ignora ambientes sem localStorage (ex.: modo privado restrito).
  }
}
