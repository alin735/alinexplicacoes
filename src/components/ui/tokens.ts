// ─── Vocabulário visual do site ───────────────────────────────────────────────
//
// Antes desta reformulação cada página repetia à mão as suas cores, os seus
// espaçamentos e a sua ideia de cartão. O resultado é que páginas irmãs iam
// divergindo: umas com azul, outras a preto, cantos de raios diferentes,
// heróis com alturas diferentes.
//
// Este ficheiro é o único sítio onde essas decisões vivem. As páginas usam os
// componentes de `@/components/ui`, e esses componentes leem daqui. Mudar uma
// cor ou um raio aqui muda o site inteiro.

/** Preto puro. Só para títulos e para o fundo dos elementos que gritam. */
export const TINTA = '#000000';
/** Preto de trabalho: texto forte, botões, ícones. Menos duro que o puro. */
export const TINTA_SUAVE = '#111111';
/** Cinzento de apoio: legendas, metadados, texto secundário. */
export const TINTA_FRACA = '#6b7280';

/** Fundo das páginas. O branco fica reservado para os cartões e os heróis. */
export const FUNDO = '#f5f5f5';
export const FUNDO_CARTAO = '#ffffff';
/** Um degrau abaixo do branco, para campos e zonas passivas dentro de cartões. */
export const FUNDO_SUBTIL = '#fafafa';

/**
 * Âmbar: a cor de destaque do site. É o que assinala novidade, urgência ou
 * "olha para aqui" nas páginas /correcoes e /explicacoes-top.
 */
export const DESTAQUE = '#f59e0b';
export const DESTAQUE_FUNDO = '#fff7ed';
export const DESTAQUE_TEXTO = '#b45309';

/** Verde: confirmação e tranquilização ("é gratuito", "já disponível"). */
export const CONFIRMA = '#16a34a';
export const CONFIRMA_FUNDO = '#f0fdf4';
export const CONFIRMA_TEXTO = '#15803d';

// ─── Peças de classe reutilizadas ────────────────────────────────────────────
// Guardadas como texto porque o Tailwind precisa de ver as classes escritas por
// extenso para as gerar. Não construir estas cadeias por concatenação.

// ─── Botões ──────────────────────────────────────────────────────────────────
//
// O tamanho vem incluído em cada constante em vez de ser acrescentado pelo
// lado de fora. Duas classes de tamanho na mesma cadeia (`text-sm` da base e
// `text-lg` de quem chama) não se resolvem pela ordem em que estão escritas,
// mas pela ordem em que o Tailwind as gera, e o resultado deixa de ser o que
// se lê no código. Por isso há uma constante por tamanho.
//
// A superfície branca (cartão) não está aqui porque vive dentro do
// `HighlightCard` e do `Card`, que é onde faz sentido lê-la.

const BOTAO_BASE =
  'inline-flex items-center justify-center gap-2 rounded-2xl font-bold transition-all ' +
  'disabled:cursor-not-allowed disabled:opacity-60';

/** Botão principal: preto cheio. */
export const BOTAO_PRINCIPAL =
  `${BOTAO_BASE} bg-[#111111] px-6 py-3 text-sm text-white hover:bg-[#2a2a2a]`;

/** O mesmo, no tamanho dos heróis. */
export const BOTAO_PRINCIPAL_GRANDE =
  `${BOTAO_BASE} bg-[#111111] px-8 py-4 text-lg text-white hover:-translate-y-1 hover:bg-[#2a2a2a] hover:shadow-md`;

/** Botão secundário: branco com contorno. */
export const BOTAO_SECUNDARIO =
  `${BOTAO_BASE} border border-black/25 bg-white px-6 py-3 text-sm text-[#111111] hover:border-black/50 hover:bg-black/5`;

/** O mesmo, no tamanho dos heróis. */
export const BOTAO_SECUNDARIO_GRANDE =
  `${BOTAO_BASE} border-2 border-black/60 bg-white px-8 py-4 text-lg text-[#111111] hover:-translate-y-1 hover:border-black hover:bg-black/5`;

/** Largura útil do conteúdo, por tamanho. */
export const LARGURAS = {
  estreita: 'max-w-3xl',
  media: 'max-w-4xl',
  larga: 'max-w-5xl',
  total: 'max-w-6xl',
} as const;

export type Largura = keyof typeof LARGURAS;
