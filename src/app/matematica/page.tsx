import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { PageHero, Section } from '@/components/ui';
import { ANOS, CALCULADORAS, TOTAL_VIDEOS, TOTAL_VIDEOS_CALCULADORA, TOTAL_VIDEOS_EXAMES, contarVideos, temasComVideos } from '@/data/materias';
import { absoluteUrl, tituloSeo } from '@/lib/site';

const TITLE = 'Matéria de Matemática do 7.º ao 12.º ano em vídeo';
const DESCRIPTION =
  'Matéria de Matemática do 7.º ao 12.º ano em vídeo, organizada por ano e por tema, os exames nacionais resolvidos e a calculadora gráfica.';

export const metadata: Metadata = {
  title: tituloSeo(TITLE, 'Matemática do 7.º ao 12.º ano em vídeo'),
  description: DESCRIPTION,
  alternates: { canonical: absoluteUrl('/matematica') },
  openGraph: {
    title: `${TITLE} | MatemáticaTop`,
    description: DESCRIPTION,
    url: absoluteUrl('/matematica'),
  },
};

export default function MatematicaPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Matéria de Matemática por ano',
    itemListElement: [
      ...ANOS.map((ano) => ({ name: ano.nome, url: absoluteUrl(`/matematica/${ano.slug}`) })),
      { name: 'Exames', url: absoluteUrl('/matematica/exames') },
      { name: 'Calculadora gráfica', url: absoluteUrl('/matematica/calculadora-grafica') },
    ].map((item, i) => ({ '@type': 'ListItem', position: i + 1, ...item })),
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#f5f5f5]">
        <PageHero
          pilula={`${TOTAL_VIDEOS} aulas em vídeo`}
          tomPilula="confirma"
          titulo="Matéria de Matemática por ano"
          descricao="Escolhe o teu ano."
          largura="media"
        />

        <Section largura="larga">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {ANOS.map((ano) => {
              const nVideos = contarVideos(ano);
              const nTemas = temasComVideos(ano).length;
              return (
                <Link
                  key={ano.slug}
                  href={`/matematica/${ano.slug}`}
                  className="group flex flex-col rounded-2xl border border-black/15 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <span className="text-5xl font-black leading-none text-[#000000]">{ano.numero}.º</span>
                  <span className="mt-1 text-sm font-semibold text-[#6b7280]">
                    {ano.numero >= 10 ? 'Matemática A' : 'ano'}
                  </span>
                  <span className="mt-4 text-xs font-semibold text-[#6b7280]">
                    {nVideos > 0
                      ? `${nVideos} ${nVideos === 1 ? 'vídeo' : 'vídeos'} | ${nTemas} ${nTemas === 1 ? 'tema' : 'temas'}`
                      : 'Em breve'}
                  </span>
                </Link>
              );
            })}
            <Link
              href="/matematica/exames"
              className="group flex flex-col justify-between gap-4 rounded-2xl border border-black/15 bg-[#111111] p-6 text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:col-span-2 sm:flex-row sm:items-center lg:col-span-3"
            >
              <span>
                <span className="block text-4xl font-black leading-none">Exames</span>
                <span className="mt-2 block text-sm font-semibold text-white/60">
                  9.º ano | 12.º ano
                </span>
              </span>
              <span className="text-xs font-semibold text-white/60">
                {TOTAL_VIDEOS_EXAMES} {TOTAL_VIDEOS_EXAMES === 1 ? 'resolução' : 'resoluções'} em vídeo
              </span>
            </Link>
            <Link
              href="/matematica/calculadora-grafica"
              className="group flex flex-col justify-between gap-4 rounded-2xl border border-black/15 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:col-span-2 sm:flex-row sm:items-center lg:col-span-3"
            >
              <span>
                <span className="block text-4xl font-black leading-none text-[#000000]">Calculadora gráfica</span>
                <span className="mt-2 block text-sm font-semibold text-[#6b7280]">
                  {CALCULADORAS.map((c) => c.nome).join(' | ')}
                </span>
              </span>
              <span className="text-xs font-semibold text-[#6b7280]">
                {TOTAL_VIDEOS_CALCULADORA} {TOTAL_VIDEOS_CALCULADORA === 1 ? 'vídeo' : 'vídeos'}
              </span>
            </Link>
          </div>
        </Section>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </main>
      <Footer />
    </>
  );
}
