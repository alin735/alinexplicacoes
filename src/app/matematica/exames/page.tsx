import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import GaleriaVideos from '@/components/materias/GaleriaVideos';
import { PageHero, Section } from '@/components/ui';
import { BOTAO_SECUNDARIO } from '@/components/ui/tokens';
import { EXAMES, duracaoIso, thumbnailYoutube, urlYoutube } from '@/data/materias';
import { absoluteUrl, tituloSeo } from '@/lib/site';

const URL = absoluteUrl('/matematica/exames');
const TITLE = 'Exames de Matemática resolvidos: 9.º e 12.º ano';
const DESCRIPTION =
  'Correção em vídeo da prova final de Matemática do 9.º ano e do exame nacional de Matemática A do 12.º ano, questão a questão.';

export const metadata: Metadata = {
  title: tituloSeo(TITLE),
  description: DESCRIPTION,
  alternates: { canonical: URL },
  openGraph: { title: `${TITLE} | MatemáticaTop`, description: DESCRIPTION, url: URL },
};

export default function ExamesPage() {
  const grupos = EXAMES.map((e) => ({ ...e, videos: e.videos.filter((v) => !v.privado) })).filter(
    (e) => e.videos.length > 0,
  );

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Matéria', item: absoluteUrl('/matematica') },
        { '@type': 'ListItem', position: 2, name: 'Exames', item: URL },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Exames de Matemática resolvidos',
      itemListElement: grupos
        .flatMap((g) => g.videos.map((v) => ({ g, v })))
        .map(({ g, v }, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          item: {
            '@type': 'VideoObject',
            name: `${g.nome}: ${v.titulo}`,
            description: `${v.titulo}. ${g.nome}, resolução em vídeo na MatemáticaTop.`,
            thumbnailUrl: thumbnailYoutube(v),
            uploadDate: v.data,
            duration: duracaoIso(v.duracao),
            contentUrl: urlYoutube(v.id),
            embedUrl: `https://www.youtube.com/embed/${v.id}`,
            inLanguage: 'pt-PT',
          },
        })),
    },
  ];

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#f5f5f5]">
        <PageHero pilula="Exames" tomPilula="neutro" titulo="Exames de Matemática resolvidos" descricao="Prova final do 9.º ano e exame nacional de Matemática A" largura="media">
          <nav aria-label="Caminho" className="mt-5 text-sm text-[#6b7280]">
            <Link href="/matematica" className="font-semibold text-[#111111] underline underline-offset-2">
              Matéria por ano
            </Link>
            <span className="mx-2" aria-hidden>/</span>
            <span>Exames</span>
          </nav>
        </PageHero>

        {grupos.map((g, i) => (
          <Section key={g.slug} largura="total" fundo={i % 2 ? 'branco' : 'claro'} titulo={g.slug === '9-ano' ? '9.º ano' : '12.º ano'}>
            <GaleriaVideos grupos={[{ titulo: g.nome, videos: g.videos }]} />
          </Section>
        ))}

        <Section fundo="branco" separador largura="estreita">
          <div className="rounded-2xl border border-black/15 bg-[#f5f5f5] p-6 text-center sm:p-8">
            <h2 className="text-2xl font-black text-[#000000]">A preparar o exame?</h2>
            <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-gray-700">
              Se precisares de um acompanhamento mais personalizado, a MatemáticaTop também tem
              explicações do 7.º ao 12.º ano.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/explicacoes" className={BOTAO_SECUNDARIO}>
                Ver as explicações
              </Link>
            </div>
          </div>
        </Section>

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </main>
      <Footer />
    </>
  );
}
