import { unstable_noStore as noStore } from 'next/cache';
import { getServiceSupabase } from '@/lib/server-bookings';

export type BlogCategory = 'Exame Nacional' | 'Métodos de estudo' | 'Matemática A';

export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  seo_description: string;
  content: string;
  published_at: string | null;
  created_at: string;
  updated_at?: string | null;
  category: BlogCategory;
  cover_image_url: string;
  cover_image_alt: string;
  read_time: string;
  is_published: boolean;
};

const BLOG_POST_SEED: BlogPost[] = [
  {
    id: 'seed-materia-nao-lecionada',
    slug: 'materia-nao-lecionada-exame-matematica-a-2026',
    title: 'Sairá matéria que não foi dada pelos alunos no Exame de Matemática A',
    excerpt:
      'O exame de 2026 será diferente: sairão temas que alguns alunos poderão não ter dado. Aqui fica o essencial para perceber o que muda.',
    seo_description:
      'Percebe porque é que o Exame Nacional de Matemática A de 2026 pode incluir temas não lecionados por alguns alunos e como a estrutura da prova evita prejuízos.',
    content: `O exame de 2026 será diferente: sairão temas que alguns alunos poderão não ter dado.

Se quiseres ver um vídeo onde esta informação é explicada:

!youtube https://youtu.be/1hkqILlQEGg?si=Qg1khj6RWrJL3Al7

À semelhança dos anos anteriores, em 2026 haverá uma nova época de exames, na qual está incluído o Exame de Matemática A (635). Este exame engloba a matéria de 3 anos, 10.º, 11.º e 12.º anos, e será realizado no dia 23 de junho, com início às 9:30.

No entanto, o Exame de Matemática A de 2026 será um pouco diferente, já que abrangerá matéria que não foi lecionada por grande parte dos alunos. Para perceber o porquê desta situação, é necessário falar sobre as Aprendizagens Essenciais.

## O que são as Aprendizagens Essenciais?

“As Aprendizagens Essenciais são documentos de orientação curricular base na planificação, realização e avaliação do ensino e da aprendizagem, e visam promover o desenvolvimento das áreas de competências inscritas no Perfil dos Alunos à Saída da Escolaridade Obrigatória.”

Podemos entender as Aprendizagens Essenciais como os documentos que indicam os conteúdos a ser lecionados aos alunos.

Assim sendo, a grande maioria dos alunos aprendeu os conteúdos de acordo com as Aprendizagens Essenciais de 2018, mas, segundo o jornal *Público*, apenas dez turmas fizeram o seu percurso com base nas AE aprovadas em 2023.

!image /images/blog/ae-publico.png | Excerto do Público sobre as Aprendizagens Essenciais no Exame de Matemática A

## Porque é que o exame será diferente?

Apesar da discrepância no número de alunos que deu a matéria de acordo com cada uma das Aprendizagens Essenciais, o Exame de Matemática A de 2026 terá de abranger os conteúdos de ambas.

Segundo a informação divulgada, as AE de 2023 e de 2018 divergem, nomeadamente, nos seguintes conteúdos:

- Paridade de uma função
- Leis de De Morgan para conjuntos
- Monotonia e limites de sucessões
- Limite de uma sucessão de termo geral (1 + x/n)^n, com x ∈ ℝ
- Equações trigonométricas
- Triângulo de Pascal
- Binómio de Newton
- Fórmulas trigonométricas da soma, da diferença e da duplicação
- Modelos matemáticos nas eleições
- Modelos matemáticos na partilha
- Modelos matemáticos nas finanças
- Geometria sintética
- Soma de todos os termos de uma progressão geométrica de razão r, tal que |r| < 1
- Distribuições de probabilidades
- Modelo normal
- Resolução numérica de equações

!image /images/blog/ae-diferencas.png | Diferenças entre as Aprendizagens Essenciais homologadas em 2018 e em 2023

## Os alunos vão ser prejudicados?

Não. No exame, as perguntas sobre os conteúdos em que as AE divergem terão uma estrutura própria: haverá três pares de itens claramente identificados e, em cada par, o aluno responderá apenas a um dos itens.

Isto significa que o aluno pode responder à pergunta sobre a matéria que efetivamente lecionou ou, se também tiver estudado a outra, optar por essa.

!image /images/blog/ae-estrutura-prova.png | Excerto oficial sobre a estrutura da prova com pares de itens

## O que deves fazer a partir daqui?

O mais importante é preparares-te com método. Perceber esta alteração ajuda, mas o essencial continua a ser estudar com organização e saber quais são os temas que costumam sair.

**Ligações úteis:**
- [Quero aceder a um plano de preparação para o exame](/exames-nacionais/cronogramas)
- [Quero ver a frequência com que cada tema sai no exame](/exames-nacionais/o-que-sai)`,
    published_at: '2026-04-25T10:00:00.000Z',
    created_at: '2026-04-25T10:00:00.000Z',
    updated_at: '2026-04-25T10:00:00.000Z',
    category: 'Exame Nacional',
    cover_image_url: '/images/blog/materia-nao-dada-thumb.png',
    cover_image_alt: 'Ilustração sobre matéria não dada no exame',
    read_time: '4 min',
    is_published: true,
  },
  {
    id: 'seed-plano-preparacao',
    slug: 'como-fazer-plano-preparacao-exame-matematica-a',
    title: 'Como fazer um plano de preparação para o Exame de Matemática A',
    excerpt:
      'Um plano de preparação é um instrumento muito importante para uma boa nota no exame. Aqui fica um guia para o construíres bem.',
    seo_description:
      'Aprende a construir um plano de preparação para o Exame de Matemática A com objetivos realistas, estratégia de estudo e organização por prioridades.',
    content: `Um plano de preparação é um instrumento muito importante para uma boa nota no exame. Se queres chegar ao dia da prova com mais controlo, menos ansiedade e uma estratégia clara, vale a pena montares um plano a sério.

## 1. Define o teu objetivo

Quanto é que precisas para o exame? Precisas de um 19? De um 10? De um 14?

Antes de planificares o teu estudo, tem em conta a nota mínima que pretendes ter. Obviamente que o objetivo é sempre ter a nota máxima. O problema é que, para se ter um 20, a estratégia de estudo é uma e é necessário ter bases sólidas.

Como é que são as tuas bases? Qual foi a tua nota a Matemática A? Achas que essa nota reflete as tuas capacidades ou devias ter tido mais ou menos? Sê sincero e pensa numa nota alcançável com esforço e tendo em conta as tuas capacidades. Sê ambicioso, mas realista.

## 2. Muda a tua mentalidade

Agora que já tens o teu objetivo definido para o exame, tens de trabalhar para o alcançar. Se a nota que pretendes exige esforço, tens de perceber isso desde já.

O Exame de Matemática A é difícil, é verdade, a matéria não é fácil e é matéria de 3 anos, mas isso não significa que seja impossível tirar a nota que queres. Para tirares essa nota, vais ter de reorganizar as tuas prioridades e fazer sacrifícios: vais ter de estudar.

É um esforço, mas um esforço que vale a pena. Pensa bem: o que preferes, sofrer um pouco agora com a necessidade de te esforçares ou sofrer depois com o arrependimento de que devias ter estudado?

## 3. Planifica a estratégia

Já sabes a nota que precisas e já estás determinado a fazer o que for preciso para a alcançar. Falta decidir como é que o estudo vai ser realizado. Dependendo da nota que queres, a tua estratégia será diferente.

### Preciso de um 10

Se precisares de ter metade da cotação máxima, então a estratégia vai incidir em saberes muito bem um conjunto mais restrito de temas ou perguntas.

1. Resolve o exame mais recente, vê a sua correção e percebe quais são os temas que sabes mais e quais sabes menos.
2. Aperfeiçoa os temas que sabes mais, porque esses tens de acertar no exame. Depois, relativamente àqueles que não sabes tão bem, tenta perceber quais é que podes entender completamente se os estudares através da resolução de mais exercícios de exame.
3. Em 2026, a estrutura vai ser diferente, então dá uma olhada nas AE de 2023. Há temas acessíveis, como os modelos matemáticos, que te podem ajudar a ganhar alguns pontos.
4. Quando entenderes bem temas que cubram cerca de 60% do exame, dá uma olhada nos restantes para a possibilidade de espremer mais alguns pontos.

### Preciso de um 14

Se precisares de cerca de 70% da cotação, então vais ter de ter um grande entendimento da maioria dos temas do exame. Só podes falhar cerca de 4 perguntas, pelo que o teu estudo terá de abranger praticamente todos os temas.

1. Resolve o exame mais recente, vê a sua correção e percebe quais são os temas que sabes mais e quais sabes menos.
2. Esclarece rapidamente as dúvidas nos temas em que já tens mais bases e começa a focar-te naqueles em que tens mais dificuldades.
3. Revê a teoria e faz exercícios de exame, corrige-os, volta a fazer exercícios, volta a corrigi-los, até que os padrões fiquem bem mecanizados.
4. Garante que percorreste e entendeste bem todos os temas do programa e dá também uma olhada nas AE de 2023.
5. Resolve mais exames.

### Preciso de um 18-20

Se precisares de ter mais de 90% da cotação, então suponho que tens uma base muito sólida da matéria e que, ao longo do secundário, deste-te bem com a Matemática A.

1. Resolve o exame mais recente e vê se há alguma matéria que ainda não está bem esclarecida.
2. Se houver, esclarece-a, revendo a teoria e resolvendo perguntas de exame. Se não houver, continua a resolver mais exames.
3. Quando já tiveres resolvido bastantes exames, vais começar a mecanizar o tipo de exercícios e a sentir-te mais confortável. Nessa fase, os exercícios mais difíceis passam a ser os “papa-vintes”.
4. Resolve o “papa-vintes” de cada ano para treinares o teu cérebro a lidar com questões de maior dificuldade e procura também exercícios de demonstrações no manual ou na internet.

## 4. Plano de preparação

Agora que já tens a estratégia delineada, constrói o teu plano de preparação em função do tempo que tens até ao exame e de acordo com a tua estratégia e com as tuas prioridades.

Um bom plano de preparação deve:

- distribuir os temas pelo tempo que tens até ao exame
- dar mais espaço à matéria em que tens mais dificuldade
- reservar tempo para revisão
- incluir resolução de exames completos

Se precisares de ajuda, já fiz 19 cronogramas para o exame, construídos de acordo com a altura em que se vai começar a estudar e com o tema em que se tem mais dificuldade. Estes cronogramas abordam todos os temas do exame. Podes usá-los como plano de preparação ou apenas como referência para construíres o teu.

Já tens o teu plano de preparação. Agora só falta uma coisa: começar já a trabalhar.

**Ligações úteis:**
- [Ver cronogramas de preparação](/exames-nacionais/cronogramas)
- [Marcar uma explicação](/marcar)`,
    published_at: '2026-04-25T11:00:00.000Z',
    created_at: '2026-04-25T11:00:00.000Z',
    updated_at: '2026-04-25T11:00:00.000Z',
    category: 'Métodos de estudo',
    cover_image_url: '/images/blog/plano-preparacao-thumb.png',
    cover_image_alt: 'Ilustração sobre plano de preparação',
    read_time: '6 min',
    is_published: true,
  },
  {
    id: 'seed-prova-ensaio-9ano',
    slug: 'correcao-da-prova-ensaio-9ano',
    title: 'Correção da prova ensaio 9º ano',
    excerpt:
      'No dia 23 de abril realizou-se mais uma prova ensaio de Matemática do 9º ano. Aqui podes encontrar a correção em PDF ou em vídeo.',
    seo_description:
      'Consulta a correção da prova ensaio de Matemática do 9º ano de 2026, em PDF ou vídeo, e percebe o objetivo desta prova de preparação.',
    content: `No dia 23 de abril, realizou-se mais uma prova ensaio de matemática do 9º ano. Esta prova tem como objetivo preparar os alunos para o Exame Nacional de Matemática, bem como testar e aperfeiçoar detalhes técnicos para as provas finais.

Desde o ano passado, as provas finais, e também as provas ensaio, passaram a ser realizadas num novo formato: enunciado digital e resolução em papel. Foi uma mudança que gerou controvérsia e que foi acompanhada pela decisão de que as provas digitais não seriam disponibilizadas ao público.

Assim, supostamente, após a sua realização no dia 23 de abril, ninguém conseguiria aceder ao enunciado da prova ensaio de matemática, a não ser as autoridades correspondentes.

## Como foi possível reconstruir a prova?

No entanto, com a ajuda da comunidade MatemáticaTop, foi possível reconstituir parte da prova e, portanto, podes encontrar a sua resolução no PDF abaixo.

Se quiseres entrar na comunidade, basta ires a https://discord.gg/matematicatop.

## Correção em PDF

- [Abrir correção da prova ensaio 2026](/files/blog/correcao-prova-ensaio-2026.pdf)

## Correção em vídeo

Se preferires ver a correção em vídeo, podes aceder ao seguinte vídeo:

!youtube https://youtu.be/YyZxEvlN7qs?si=uxute-t_E2J5_L5v

## Links úteis

- [Ver cronogramas de preparação](/exames-nacionais/cronogramas)
- [Marcar uma explicação](/marcar)`,
    published_at: '2026-04-25T12:00:00.000Z',
    created_at: '2026-04-25T12:00:00.000Z',
    updated_at: '2026-04-25T12:00:00.000Z',
    category: 'Exame Nacional',
    cover_image_url: '/images/blog/prova-ensaio-thumb.png',
    cover_image_alt: 'Ilustração para correção da prova ensaio',
    read_time: '3 min',
    is_published: true,
  },
];

function mapBlogRow(row: Record<string, unknown>): BlogPost {
  return {
    id: String(row.id),
    slug: String(row.slug),
    title: String(row.title),
    excerpt: String(row.excerpt || ''),
    seo_description: String(row.seo_description || ''),
    content: String(row.content || ''),
    published_at: row.published_at ? String(row.published_at) : null,
    created_at: String(row.created_at || row.published_at || ''),
    updated_at: row.updated_at ? String(row.updated_at) : null,
    category: String(row.category || 'Matemática A') as BlogCategory,
    cover_image_url: String(row.cover_image_url || '/images/exames/o-que-sai-nos-exames.png'),
    cover_image_alt: String(row.cover_image_alt || 'Capa do artigo'),
    read_time: String(row.read_time || '4 min'),
    is_published: Boolean(row.is_published),
  };
}

function mergePosts(dbPosts: BlogPost[]) {
  const merged = new Map<string, BlogPost>();

  BLOG_POST_SEED.forEach((post) => {
    merged.set(post.slug, post);
  });

  dbPosts.forEach((post) => {
    merged.set(post.slug, post);
  });

  return Array.from(merged.values()).sort((a, b) => {
    const aTime = new Date(a.published_at || a.created_at).getTime();
    const bTime = new Date(b.published_at || b.created_at).getTime();
    return bTime - aTime;
  });
}

export function createBlogPostSlug(title: string) {
  return title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function getPublishedBlogPosts() {
  noStore();

  try {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .order('created_at', { ascending: false });

    if (error || !data) {
      return BLOG_POST_SEED;
    }

    return mergePosts(data.map((row) => mapBlogRow(row as Record<string, unknown>)).filter((row) => row.is_published));
  } catch {
    return BLOG_POST_SEED;
  }
}

export async function getBlogPostBySlug(slug: string) {
  noStore();

  try {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .eq('is_published', true)
      .maybeSingle();

    if (!error && data) {
      return mapBlogRow(data as Record<string, unknown>);
    }
  } catch {
    // noop
  }

  return BLOG_POST_SEED.find((post) => post.slug === slug) ?? null;
}

export function getSeedBlogPosts() {
  return BLOG_POST_SEED.slice();
}

export async function getAllBlogPosts() {
  return getPublishedBlogPosts();
}
