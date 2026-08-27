/**
 * Definições partilhadas entre servidor e cliente (o painel de admin é um
 * componente de cliente, por isso este módulo não pode importar next/headers).
 */
export type MaterialKind =
  | 'powerpoint' | 'ficha' | 'tpc' | 'gravacao'
  | 'importante' | 'ficha_revisao' | 'teste' | 'outro';


export const MATERIAL_LABELS: Record<MaterialKind, string> = {
  powerpoint: 'PowerPoint da aula',
  ficha: 'Ficha',
  tpc: 'TPC',
  gravacao: 'Gravação',
  importante: 'Importante',
  ficha_revisao: 'Ficha de revisão',
  teste: 'Teste',
  outro: 'Recurso',
};

/**
 * Secções do portal que agregam anexos por tipo. Cada uma tem a sua aba e a
 * sua página, e é alimentada por anexos de aulas desbloqueadas mais itens
 * avulsos ligados ao percurso.
 */
export type SectionSlug = 'importante' | 'powerpoints' | 'fichas' | 'testes';

export type PortalSection = {
  slug: SectionSlug;
  kind: MaterialKind;
  aba: string;
  titulo: string;
  descricao: string;
  emoji: string;
  vazio: string;
  /** Organiza os anexos por tema/subtema? Só o Importante o faz. */
  temas: boolean;
};

export const PORTAL_SECTIONS: Record<SectionSlug, PortalSection> = {
  importante: {
    slug: 'importante',
    kind: 'importante',
    aba: '⭐ Importante',
    titulo: 'Importante',
    descricao: 'O essencial das tuas aulas, reunido e organizado por tema.',
    emoji: '⭐',
    vazio: 'Ainda não há nada aqui. Os materiais mais importantes das tuas aulas vão aparecer nesta secção.',
    temas: true,
  },
  powerpoints: {
    slug: 'powerpoints',
    kind: 'powerpoint',
    aba: 'PowerPoints',
    titulo: 'PowerPoints',
    descricao: 'Os slides das aulas, reunidos e organizados por tema.',
    emoji: '📊',
    vazio: 'Ainda não há PowerPoints publicados. Assim que houver, aparecem aqui.',
    temas: true,
  },
  fichas: {
    slug: 'fichas',
    kind: 'ficha_revisao',
    aba: 'Fichas de Revisão',
    titulo: 'Fichas de revisão',
    descricao: 'Resumos e formulários para reveres a matéria por tua conta.',
    emoji: '📄',
    vazio: 'Ainda não há fichas de revisão publicadas. Assim que houver, aparecem aqui.',
    temas: false,
  },
  testes: {
    slug: 'testes',
    kind: 'teste',
    aba: 'Testes',
    titulo: 'Testes',
    descricao: 'Testes e simulações para praticares em condições de prova.',
    emoji: '📝',
    vazio: 'Ainda não há testes publicados. Assim que houver, aparecem aqui.',
    temas: false,
  },
};

export const SECTION_LIST: PortalSection[] = [
  PORTAL_SECTIONS.importante,
  PORTAL_SECTIONS.powerpoints,
  PORTAL_SECTIONS.fichas,
  PORTAL_SECTIONS.testes,
];

