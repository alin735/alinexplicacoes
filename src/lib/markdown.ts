/**
 * Versões em Markdown das páginas públicas, para agentes de IA.
 *
 * Um agente que pede uma página com `Accept: text/markdown` recebe isto em vez
 * do HTML (o middleware reencaminha para /md/...), e o /llms.txt usa as mesmas
 * peças. O conteúdo vem das mesmas fontes que as páginas (materias.ts e o
 * blog), por isso não há nada para manter em duplicado.
 */
import {
  ANOS,
  EXAMES,
  anoCurto,
  duracaoLegivel,
  getAno,
  getTema,
  temasComVideos,
  todosOsVideos,
  urlYoutube,
  videosDoTema,
  type Video,
} from '@/data/materias';
import { getBlogPostBySlug, getPublishedBlogPosts } from '@/lib/blog-posts';
import { SITE_DESCRIPTION, SITE_NAME, absoluteUrl } from '@/lib/site';

const linhaVideo = (v: Video) =>
  `- [${v.titulo}](${urlYoutube(v.id)})${v.duracao ? ` (${duracaoLegivel(v.duracao)})` : ''}`;

const nivel = (numero: number) => (numero >= 10 ? 'Matemática A' : 'Matemática');

function indiceMateria() {
  const linhas: string[] = [];
  for (const ano of ANOS) {
    const temas = temasComVideos(ano);
    if (temas.length === 0) continue;
    linhas.push(`- [${nivel(ano.numero)} do ${anoCurto(ano)}](${absoluteUrl(`/matematica/${ano.slug}`)})`);
    for (const t of temas) {
      linhas.push(`  - [${t.nome}](${absoluteUrl(`/matematica/${ano.slug}/${t.slug}`)})`);
    }
  }
  linhas.push(`- [Exames resolvidos (9.º e 12.º ano)](${absoluteUrl('/matematica/exames')})`);
  return linhas.join('\n');
}

export function mdInicio() {
  return `# ${SITE_NAME}

> ${SITE_DESCRIPTION}

## Matéria em vídeo, por ano e por tema

${indiceMateria()}

## Explicações

- [Explicações de Matemática online](${absoluteUrl('/explicacoes')}): individuais (17 € por hora) ou em grupo (a partir de 8 € por aluno), do 7.º ao 12.º ano, num quadro partilhado.

## Exame nacional

- [O que sai no exame de Matemática A](${absoluteUrl('/exames-nacionais/o-que-sai')})
- [Cronogramas de estudo](${absoluteUrl('/exames-nacionais/cronogramas')})
- [Blog](${absoluteUrl('/blog')}): exames e métodos de estudo
`;
}

export function mdMateria() {
  return `# Matéria de Matemática por ano

${indiceMateria()}
`;
}

export function mdAno(slug: string) {
  const ano = getAno(slug);
  if (!ano) return null;
  const temas = ano.temas.map((t) =>
    todosOsVideos(t).length > 0
      ? `- [${t.nome}](${absoluteUrl(`/matematica/${ano.slug}/${t.slug}`)})`
      : `- ${t.nome} (em breve)`,
  );
  return `# ${nivel(ano.numero)} do ${anoCurto(ano)}

Os temas do ano, pela ordem em que são dados na escola:

${temas.join('\n')}
`;
}

export function mdTema(anoSlug: string, temaSlug: string) {
  const encontrado = getTema(anoSlug, temaSlug);
  if (!encontrado || todosOsVideos(encontrado.tema).length === 0) return null;
  const { ano, tema } = encontrado;
  const { completo, topicos, exercicios } = videosDoTema(tema);
  const partes = [`# ${tema.nome} ${anoCurto(ano)}`, `${tema.nome}, ${nivel(ano.numero)} do ${anoCurto(ano)}, em vídeo.`];
  if (completo) partes.push(`## Toda a matéria\n\n${linhaVideo(completo)}`);
  if (topicos.length) partes.push(`## Por tópico\n\n${topicos.map(linhaVideo).join('\n')}`);
  if (exercicios.length) partes.push(`## Exercícios resolvidos\n\n${exercicios.map(linhaVideo).join('\n')}`);
  partes.push(`Página: ${absoluteUrl(`/matematica/${ano.slug}/${tema.slug}`)}`);
  return partes.join('\n\n') + '\n';
}

export function mdExames() {
  const grupos = EXAMES.map((e) => {
    const videos = e.videos.filter((v) => !v.privado);
    return videos.length ? `## ${e.nome}\n\n${videos.map(linhaVideo).join('\n')}` : '';
  }).filter(Boolean);
  return `# Exames de Matemática resolvidos\n\n${grupos.join('\n\n')}\n`;
}

export async function mdBlog() {
  const posts = await getPublishedBlogPosts();
  return `# Blog da ${SITE_NAME}

${posts.map((p) => `- [${p.title}](${absoluteUrl(`/blog/${p.slug}`)}): ${p.excerpt}`).join('\n')}
`;
}

export async function mdArtigo(slug: string) {
  const post = await getBlogPostBySlug(slug);
  if (!post) return null;
  return `# ${post.title}

> ${post.excerpt}

${post.content}
`;
}

/** Markdown da página em `caminho` ("/", "/matematica/9-ano", ...), ou null se não houver versão. */
export async function markdownDe(caminho: string): Promise<string | null> {
  const p = caminho.replace(/\/+$/, '') || '/';
  if (p === '/') return mdInicio();
  if (p === '/matematica') return mdMateria();
  if (p === '/matematica/exames') return mdExames();
  if (p === '/blog') return mdBlog();
  const partes = p.split('/').filter(Boolean);
  if (partes[0] === 'matematica' && partes.length === 2) return mdAno(partes[1]);
  if (partes[0] === 'matematica' && partes.length === 3) return mdTema(partes[1], partes[2]);
  if (partes[0] === 'blog' && partes.length === 2) return mdArtigo(partes[1]);
  return null;
}
