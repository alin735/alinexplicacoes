/**
 * A matéria de Matemática do 7.º ao 12.º ano, por ano e por tema, com os
 * vídeos do canal de YouTube.
 *
 * É a fonte única de /matematica, /matematica/[ano] e /matematica/[ano]/[tema].
 * Cada tema tem três tipos de vídeo:
 *  - `completo`: o vídeo com toda a matéria do tema (aparece grande, no topo);
 *  - `topicos`: os cortes, um por tópico, pela ordem da matéria;
 *  - `exercicios`: resoluções de exercícios e exames.
 *
 * Para acrescentar um vídeo: copia uma linha, troca o `id` (o que está em
 * youtube.com/watch?v=ID ou youtu.be/ID), o título, a `data` de publicação e
 * a `duracao` em segundos. A data e a duração são o que o Google pede para
 * mostrar o vídeo nos resultados de pesquisa.
 *
 * Vídeos ainda privados levam `privado: true`: ficam guardados aqui mas não
 * aparecem no site (um vídeo privado não se vê fora do YouTube). Quando o
 * tornares público, tira o `privado`, e acrescenta `data` e `duracao`.
 */

export type Video = {
  id: string;
  /** Título curto, sem o ano nem o tema (já estão na página). */
  titulo: string;
  /** Data de publicação no YouTube, ISO 8601. */
  data?: string;
  /** Duração em segundos. */
  duracao?: number;
  privado?: boolean;
  /**
   * Vídeos antigos sem miniatura em alta resolução no YouTube (1280×720).
   * Para esses usa-se a de 640×480. Os vídeos novos não precisam disto.
   */
  semMaxres?: boolean;
};

export type Tema = {
  slug: string;
  nome: string;
  completo?: Video;
  topicos: Video[];
  exercicios: Video[];
};

export type Ano = {
  slug: string;
  /** "7.º ano", "Matemática A | 10.º ano" */
  nome: string;
  numero: number;
  temas: Tema[];
};

export const ANOS: Ano[] = [
  {
    slug: '7ano',
    nome: '7.º ano',
    numero: 7,
    temas: [
    {
      slug: 'numeros-inteiros',
      nome: 'Números inteiros',
      completo: { id: 'QDSBP3zUuLs', titulo: 'Números inteiros: toda a matéria', data: '2026-10-02T08:30:09-07:00', duracao: 894 },
      topicos: [],
      exercicios: [],
    },
    { slug: 'numeros-racionais', nome: 'Números racionais', topicos: [], exercicios: [] },
    { slug: 'sequencias', nome: 'Sequências e regularidades', topicos: [], exercicios: [] },
    { slug: 'equacoes', nome: 'Equações do 1.º grau', topicos: [], exercicios: [] },
    { slug: 'funcoes', nome: 'Funções', topicos: [], exercicios: [] },
    { slug: 'estatistica-e-probabilidades', nome: 'Dados e probabilidades', topicos: [], exercicios: [] },
    { slug: 'figuras-planas-e-solidos', nome: 'Figuras planas e sólidos', topicos: [], exercicios: [] },
    { slug: 'semelhanca', nome: 'Semelhança de figuras', topicos: [], exercicios: [] },
    ],
  },
  {
    slug: '8ano',
    nome: '8.º ano',
    numero: 8,
    temas: [
    {
      slug: 'numeros-racionais',
      nome: 'Números racionais',
      completo: { id: 'DPQTKAoGgHs', titulo: 'Números racionais: toda a matéria', data: '2026-10-02T08:00:18-07:00', duracao: 1440 },
      topicos: [
          { id: '8IjX4Vux_as', titulo: 'Dízimas e multiplicação e divisão de frações', data: '2026-10-02T12:00:28-07:00', duracao: 388 },
          { id: 'e5elgIONLTY', titulo: 'Potências e expressões numéricas', data: '2026-10-03T12:00:37-07:00', duracao: 542 },
          { id: 'znodkZcIrAM', titulo: 'Raízes quadradas e cúbicas', privado: true },
          { id: 'k52G3Xk2caY', titulo: 'Notação científica', privado: true },
      ],
      exercicios: [],
    },
    { slug: 'polinomios-e-equacoes', nome: 'Polinómios e equações', topicos: [], exercicios: [] },
    { slug: 'sistemas-de-equacoes', nome: 'Sistemas de equações', topicos: [], exercicios: [] },
    { slug: 'funcao-afim', nome: 'Função afim', topicos: [], exercicios: [] },
    { slug: 'estatistica-e-probabilidades', nome: 'Dados e probabilidades', topicos: [], exercicios: [] },
    { slug: 'teorema-de-pitagoras', nome: 'Teorema de Pitágoras', topicos: [], exercicios: [] },
    { slug: 'vetores-e-isometrias', nome: 'Vetores e isometrias', topicos: [], exercicios: [] },
    { slug: 'areas-e-volumes', nome: 'Áreas e volumes', topicos: [], exercicios: [] },
    ],
  },
  {
    slug: '9ano',
    nome: '9.º ano',
    numero: 9,
    temas: [
    {
      slug: 'numeros-reais',
      nome: 'Números reais e inequações',
      completo: { id: 'JS3HkKt6ARc', titulo: 'Números reais e inequações: toda a matéria', data: '2026-09-26T08:54:41-07:00', duracao: 1498 },
      topicos: [
          { id: 'H3vbSgsY3Gc', titulo: 'Números reais: dízimas, conjuntos e ordenar', data: '2026-10-02T11:00:22-07:00', duracao: 626 },
          { id: 'nQ1GuhEf8CQ', titulo: 'Intervalos de números reais', data: '2026-10-03T08:00:02-07:00', duracao: 456 },
          { id: 'cNyOnxzmLnY', titulo: 'Inequações do 1.º grau', privado: true },
      ],
      exercicios: [],
    },
    { slug: 'equacoes-do-2-grau', nome: 'Equações do 2.º grau', topicos: [], exercicios: [] },
    { slug: 'funcoes', nome: 'Funções', topicos: [], exercicios: [] },
    { slug: 'trigonometria', nome: 'Trigonometria', topicos: [], exercicios: [] },
    { slug: 'circunferencia-e-lugares-geometricos', nome: 'Circunferência e lugares geométricos', topicos: [], exercicios: [] },
    { slug: 'probabilidades', nome: 'Probabilidades', topicos: [], exercicios: [] },
    { slug: 'estatistica', nome: 'Estatística', topicos: [], exercicios: [] },
    ],
  },
  {
    slug: '10ano',
    nome: 'Matemática A | 10.º ano',
    numero: 10,
    temas: [
    {
      slug: 'modelos-matematicos',
      nome: 'Modelos matemáticos',
      completo: { id: 'UD3fP74fmMk', titulo: 'Modelos matemáticos: toda a matéria', data: '2026-09-25T06:59:58-07:00', duracao: 1960 },
      topicos: [
          { id: 'oat9UYnC8eA', titulo: 'Tipos de votos e percentagens', data: '2026-09-28T14:15:39-07:00', duracao: 339 },
          { id: '_irKoTX_C1A', titulo: 'Eleições: maioria simples, maioria absoluta e método de Borda', data: '2026-09-29T12:00:40-07:00', duracao: 635 },
          { id: 'eZzBJkOMDC0', titulo: 'Método de Hondt e Sainte-Laguë', data: '2026-09-30T12:00:09-07:00', duracao: 306 },
          { id: 'OKFuaXxPlbI', titulo: 'Salários e IRS', data: '2026-10-01T11:00:39-07:00', duracao: 721 },
          { id: '0zk8jhfka8o', titulo: 'Juros simples e compostos', data: '2026-10-02T11:00:30-07:00', duracao: 676 },
      ],
      exercicios: [],
    },
    { slug: 'funcoes', nome: 'Funções', topicos: [], exercicios: [] },
    { slug: 'geometria-analitica', nome: 'Geometria analítica', topicos: [], exercicios: [] },
    { slug: 'geometria-sintetica', nome: 'Geometria sintética', topicos: [], exercicios: [] },
    { slug: 'estatistica', nome: 'Estatística', topicos: [], exercicios: [] },
    ],
  },
  {
    slug: '11ano',
    nome: 'Matemática A | 11.º ano',
    numero: 11,
    temas: [
    {
      slug: 'trigonometria',
      nome: 'Trigonometria',
      completo: { id: '0aRBuXLSnco', titulo: 'Trigonometria: toda a matéria', data: '2026-09-27T13:25:51-07:00', duracao: 3229 },
      topicos: [
          { id: 'ORuL5Twt4-0', titulo: 'Ângulos orientados e generalizados', data: '2026-09-28T13:40:20-07:00', duracao: 365 },
          { id: '4kba1PJeozs', titulo: 'Círculo trigonométrico', data: '2026-09-29T11:00:03-07:00', duracao: 489 },
          { id: 'mrBejMMCfBU', titulo: 'Radianos', data: '2026-09-30T11:00:03-07:00', duracao: 311 },
          { id: 'N-1wGFOOnNE', titulo: 'Fórmulas da trigonometria', data: '2026-10-01T10:00:39-07:00', duracao: 550 },
          { id: '-p1d_R49RB4', titulo: 'Redução ao 1.º quadrante', data: '2026-10-02T10:00:06-07:00', duracao: 504 },
          { id: 't02HohIyqik', titulo: 'Funções trigonométricas', data: '2026-10-03T08:00:05-07:00', duracao: 377 },
          { id: '2A9N6GfG6Rk', titulo: 'Transformações de funções trigonométricas', data: '2026-10-03T09:00:09-07:00', duracao: 504 },
          { id: 'A9ze6Ku67eM', titulo: 'Zeros e extremos de funções trigonométricas', data: '2026-10-03T10:00:28-07:00', duracao: 573 },
      ],
      exercicios: [
          { id: 'apz3wgPylAc', titulo: 'Problema sem ângulo reto', data: '2026-09-18T08:28:38-07:00', duracao: 458 },
          { id: 'iMtMnI8b5f8', titulo: 'O problema dos dois triângulos', data: '2026-09-18T08:23:43-07:00', duracao: 708 },
      ],
    },
    { slug: 'produto-escalar', nome: 'Produto escalar', topicos: [], exercicios: [] },
    {
      slug: 'contagem',
      nome: 'Contagem',
      completo: { id: 'wqgt1zxxbVM', titulo: 'Contagem: toda a matéria', data: '2026-02-14T06:26:09-08:00', duracao: 1617, semMaxres: true },
      topicos: [],
      exercicios: [],
    },
    {
      slug: 'sucessoes',
      nome: 'Sucessões',
      completo: { id: 'hqGnL7qiHZY', titulo: 'Sucessões: toda a matéria', data: '2026-04-14T09:25:28-07:00', duracao: 2029, semMaxres: true },
      topicos: [],
      exercicios: [],
    },
    {
      slug: 'funcoes-polinomiais-e-racionais',
      nome: 'Funções polinomiais e racionais',
      completo: { id: 'BHRAhoVc7rg', titulo: 'Funções polinomiais e racionais: toda a matéria', data: '2026-04-27T11:19:44-07:00', duracao: 2848 },
      topicos: [],
      exercicios: [],
    },
    { slug: 'calculo-diferencial', nome: 'Cálculo diferencial', topicos: [], exercicios: [] },
    ],
  },
  {
    slug: '12ano',
    nome: 'Matemática A | 12.º ano',
    numero: 12,
    temas: [
    {
      slug: 'numeros-complexos',
      nome: 'Números complexos',
      completo: { id: 'ydIteo7npAc', titulo: 'Números complexos: toda a matéria', data: '2026-09-24T12:32:12-07:00', duracao: 3173 },
      topicos: [
          { id: '3Av3tvnccrw', titulo: 'Potências de i', data: '2026-09-28T12:09:46-07:00', duracao: 292 },
          { id: 'A6VS747PGr8', titulo: 'Forma algébrica e plano complexo', data: '2026-09-29T10:00:04-07:00', duracao: 598 },
          { id: '4REWLFeJDh0', titulo: 'Forma trigonométrica: módulo e argumento', data: '2026-09-30T10:00:21-07:00', duracao: 615 },
          { id: 'xUamIop1Vx4', titulo: 'Operações na forma trigonométrica', data: '2026-10-01T09:00:14-07:00', duracao: 522 },
          { id: 'ek7rPSi5l4U', titulo: 'Raízes de números complexos', data: '2026-10-02T09:00:09-07:00', duracao: 481 },
          { id: 'CVhucjUtdN0', titulo: 'Condições no plano complexo', data: '2026-10-03T08:00:32-07:00', duracao: 1065 },
      ],
      exercicios: [],
    },
    { slug: 'probabilidades', nome: 'Probabilidades', topicos: [], exercicios: [] },
    { slug: 'exponenciais-e-logaritmos', nome: 'Funções exponenciais e logarítmicas', topicos: [], exercicios: [] },
    { slug: 'limites-e-derivadas', nome: 'Limites e derivadas', topicos: [], exercicios: [] },
    ],
  },
];

/**
 * As resoluções das provas e exames nacionais, separadas da matéria dos anos.
 * Aparecem em /matematica/exames, um grupo por ano de exame.
 */
export const EXAMES: { slug: string; nome: string; videos: Video[] }[] = [
  {
    slug: '9ano',
    nome: 'Prova final do 9.º ano',
    videos: [
      { id: 'UqBaYSoR3RE', titulo: 'Prova final 2026: resolução completa', data: '2026-06-22T14:55:04-07:00', duracao: 3449 },
      { id: 'YyZxEvlN7qs', titulo: 'Prova de ensaio 2026: resolução completa', data: '2026-04-25T14:06:24-07:00', duracao: 2159 },
    ],
  },
  {
    slug: '12ano',
    nome: 'Exame nacional de Matemática A (12.º ano)',
    videos: [
      { id: 'LLAqgLynzko', titulo: 'Exame nacional 2026: resolução completa', data: '2026-07-04T06:51:56-07:00', duracao: 10000 },
    ],
  },
];

/**
 * Os vídeos da calculadora gráfica, numa secção própria (/matematica/calculadora-grafica),
 * uma coluna por modelo. Servem o secundário todo, por isso não ficam dentro de um ano.
 */
export const CALCULADORAS: { slug: string; nome: string; videos: Video[] }[] = [
  {
    slug: 'casio-fx-cg50',
    nome: 'Casio fx-CG50',
    videos: [
      { id: '63UXDLa3aYU', titulo: 'Casio fx-CG50: introdução', data: '2026-09-17T10:35:36-07:00', duracao: 912 },
    ],
  },
  {
    slug: 'ti-nspire-cx-ii-t',
    nome: 'TI-Nspire CX II-T',
    videos: [
      { id: 'dyNURV3SVxE', titulo: 'TI-Nspire CX II-T: introdução', data: '2026-09-17T11:34:39-07:00', duracao: 1386 },
    ],
  },
  {
    slug: 'numworks',
    nome: 'NumWorks',
    videos: [
      { id: 'O0gcsVnXeCs', titulo: 'NumWorks: introdução', data: '2026-09-17T13:48:47-07:00', duracao: 876 },
    ],
  },
];

// ─── Acesso ──────────────────────────────────────────────────────────────────

const publico = (v?: Video): v is Video => !!v && !v.privado;

/** Os vídeos de um tema que se podem ver, separados por tipo. */
export function videosDoTema(tema: Tema) {
  return {
    completo: publico(tema.completo) ? tema.completo : undefined,
    topicos: tema.topicos.filter(publico),
    exercicios: tema.exercicios.filter(publico),
  };
}

export function todosOsVideos(tema: Tema): Video[] {
  const { completo, topicos, exercicios } = videosDoTema(tema);
  return [...(completo ? [completo] : []), ...topicos, ...exercicios];
}

export function getAno(slug: string) {
  return ANOS.find((a) => a.slug === slug);
}

export function getTema(anoSlug: string, temaSlug: string) {
  const ano = getAno(anoSlug);
  const tema = ano?.temas.find((t) => t.slug === temaSlug);
  return ano && tema ? { ano, tema } : undefined;
}

/** Só os temas com pelo menos um vídeo público têm página própria. */
export function temasComVideos(ano: Ano) {
  return ano.temas.filter((t) => todosOsVideos(t).length > 0);
}

export function contarVideos(ano: Ano) {
  return ano.temas.reduce((n, t) => n + todosOsVideos(t).length, 0);
}

export const TOTAL_VIDEOS_EXAMES = EXAMES.reduce((n, e) => n + e.videos.filter(publico).length, 0);

export const TOTAL_VIDEOS_CALCULADORA = CALCULADORAS.reduce((n, c) => n + c.videos.filter(publico).length, 0);

export const TOTAL_VIDEOS = ANOS.reduce((n, a) => n + contarVideos(a), 0) + TOTAL_VIDEOS_EXAMES + TOTAL_VIDEOS_CALCULADORA;

/** "7.º ano" ou "12.º ano", sem o "Matemática A". */
export function anoCurto(ano: Ano) {
  return `${ano.numero}.º ano`;
}

/** Miniatura do YouTube na maior resolução disponível (1280×720, ou 640×480 nos antigos). */
export function thumbnailYoutube(video: Pick<Video, 'id' | 'semMaxres'> | string) {
  const v = typeof video === 'string' ? { id: video } : video;
  return `https://i.ytimg.com/vi/${v.id}/${'semMaxres' in v && v.semMaxres ? 'sddefault' : 'maxresdefault'}.jpg`;
}

export function urlYoutube(id: string) {
  return `https://www.youtube.com/watch?v=${id}`;
}

/**
 * Junta itens em "a, b e c" até caber em `limite` caracteres contando com o
 * prefixo. Serve para as meta descriptions: o Google corta por volta dos 155.
 */
export function listaQueCabe(prefixo: string, itens: string[], limite = 155) {
  const minus = itens.map((t) => t.charAt(0).toLowerCase() + t.slice(1));
  for (let n = minus.length; n > 0; n--) {
    const parte = minus.slice(0, n);
    const lista = parte.length === 1 ? parte[0] : `${parte.slice(0, -1).join(', ')} e ${parte[parte.length - 1]}`;
    const frase = `${prefixo}${lista}.`;
    if (frase.length <= limite) return frase;
  }
  return `${prefixo.replace(/[:,]\s*$/, '')}.`;
}

/** 894 → "14:54"; 3229 → "53:49" */
export function duracaoLegivel(segundos?: number) {
  if (!segundos) return '';
  const h = Math.floor(segundos / 3600);
  const m = Math.floor((segundos % 3600) / 60);
  const s = segundos % 60;
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
}

/** 894 → "PT14M54S", o formato que o schema.org pede. */
export function duracaoIso(segundos?: number) {
  if (!segundos) return undefined;
  const h = Math.floor(segundos / 3600);
  const m = Math.floor((segundos % 3600) / 60);
  const s = segundos % 60;
  return `PT${h ? `${h}H` : ''}${m ? `${m}M` : ''}${s ? `${s}S` : ''}`;
}
