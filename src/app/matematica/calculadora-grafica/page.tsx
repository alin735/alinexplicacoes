import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import GaleriaVideos from '@/components/materias/GaleriaVideos';
import { PageHero, Section } from '@/components/ui';
import { BOTAO_SECUNDARIO } from '@/components/ui/tokens';
import { CALCULADORAS, duracaoIso, thumbnailYoutube, urlYoutube } from '@/data/materias';
import { absoluteUrl, tituloSeo } from '@/lib/site';

const URL = absoluteUrl('/matematica/calculadora-grafica');
const TITLE = 'Calculadora gráfica: Casio, TI-Nspire e NumWorks';
const DESCRIPTION =
  'Como usar a calculadora gráfica no secundário e no exame de Matemática A, em vídeo: Casio fx-CG50, TI-Nspire CX II-T e NumWorks.';

export const metadata: Metadata = {
  title: tituloSeo(TITLE),
  description: DESCRIPTION,
  alternates: { canonical: URL },
  openGraph: { title: `${TITLE} | MatemáticaTop`, description: DESCRIPTION, url: URL },
};

export default function CalculadoraGraficaPage() {
  const modelos = CALCULADORAS.map((c) => ({ ...c, videos: c.videos.filter((v) => !v.privado) })).filter(
    (c) => c.videos.length > 0,
  );
  const nVideos = modelos.reduce((n, c) => n + c.videos.length, 0);

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Matéria', item: absoluteUrl('/matematica') },
        { '@type': 'ListItem', position: 2, name: 'Calculadora gráfica', item: URL },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Calculadora gráfica em vídeo',
      itemListElement: modelos
        .flatMap((c) => c.videos.map((v) => ({ c, v })))
        .map(({ c, v }, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          item: {
            '@type': 'VideoObject',
            name: `Calculadora gráfica ${v.titulo}`,
            description: `Como usar a calculadora gráfica ${c.nome}: ${v.titulo.slice(c.nome.length + 2) || v.titulo}, em vídeo na MatemáticaTop.`,
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
        <PageHero
          pilula={`${nVideos} ${nVideos === 1 ? 'aula em vídeo' : 'aulas em vídeo'}`}
          tomPilula="confirma"
          titulo="Calculadora gráfica"
          descricao={CALCULADORAS.map((c) => c.nome).join(' | ')}
          largura="media"
        >
          <nav aria-label="Caminho" className="mt-5 text-sm text-[#6b7280]">
            <Link href="/matematica" className="font-semibold text-[#111111] underline underline-offset-2">
              Matéria por ano
            </Link>
            <span className="mx-2" aria-hidden>/</span>
            <span>Calculadora gráfica</span>
          </nav>
        </PageHero>

        <Section largura="total">
          <GaleriaVideos grupos={modelos.map((c) => ({ titulo: c.nome, videos: c.videos }))} />
        </Section>

        <Section fundo="branco" separador largura="estreita">
          <div className="rounded-2xl border border-black/15 bg-[#f5f5f5] p-6 text-center sm:p-8">
            <h2 className="text-2xl font-black text-[#000000]">Precisas de ajuda?</h2>
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
