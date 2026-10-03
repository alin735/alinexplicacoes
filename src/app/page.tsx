import type { Metadata } from 'next';
import { absoluteUrl } from '@/lib/site';
import { getPublishedBlogPosts } from '@/lib/blog-posts';
import HomeClient from './HomeClient';

// A homepage é interativa (componente cliente), por isso os metadados vivem
// aqui, neste invólucro de servidor. É o que garante o canonical próprio.
export const metadata: Metadata = {
  alternates: {
    canonical: absoluteUrl('/'),
  },
};

// O mesmo texto do FAQ da página, em dados estruturados. É o que os motores de
// pesquisa e os assistentes de IA leem para responder "quanto custam as
// explicações da MatemáticaTop?" e afins. Se mudares o FAQ, muda aqui também.
const FAQ = [
  ['Como marco uma explicação?', 'Vai à secção Explicações, deixa o teu contacto e uma mensagem com o que precisas. Depois falo contigo para combinarmos o explicador, o horário e o plano. Pedir é gratuito e não te compromete a nada.'],
  ['Quanto custam as explicações?', 'As individuais são 17€ por hora. Em grupo, o preço por aluno desce até 8€, conforme o número de colegas.'],
  ['As aulas são online ou presenciais?', 'As explicações são online, num quadro branco partilhado onde escrevemos os dois ao mesmo tempo. Não precisas de instalar nada nem de te deslocar, e ficas com o que foi escrito na aula.'],
  ['Que anos e disciplinas é que dão?', 'Matemática do 7.º ao 12.º ano, incluindo Matemática A e a preparação para a prova final do 9.º ano e para o exame nacional.'],
  ['Os vídeos da matéria são gratuitos?', 'Sim, todos. Estão na secção Matéria por ano, organizados por ano e por tema, e também no canal de YouTube. Só as explicações, que são aulas contigo, é que são pagas.'],
  ['Posso usar o site para me preparar para o exame?', 'Sim, e é gratuito. A secção Exames nacionais tem cronogramas de estudo e mostra-te com que frequência cada tema saiu no exame entre 2016 e 2025.'],
  ['Onde vejo as correções dos exames?', 'Em Exames, dentro da secção da matéria. A prova final do 9.º ano e o exame nacional de Matemática A estão resolvidos em vídeo, questão a questão.'],
];

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ.map(([q, a]) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  })),
};

export default async function Page() {
  // Os artigos vêm daqui, do servidor: mostrar os últimos a sério vale mais
  // do que uma imitação desenhada, e não custa nada ao browser.
  const posts = await getPublishedBlogPosts();

  return (
    <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
    <HomeClient
      artigos={posts.slice(0, 3).map((post) => ({
        slug: post.slug,
        titulo: post.title,
        resumo: post.excerpt,
        categoria: post.category,
        tempoLeitura: post.read_time,
        imagem: post.cover_image_url,
        imagemAlt: post.cover_image_alt,
      }))}
    />
    </>
  );
}
