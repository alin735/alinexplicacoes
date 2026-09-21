import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { PageHero, Section } from '@/components/ui';
import { ANOS, TOTAL_VIDEOS, contarVideos, temasComVideos } from '@/data/materias';
import { absoluteUrl } from '@/lib/site';

const TITLE = 'Matéria de Matemática do 7.º ao 12.º ano em vídeo';
const DESCRIPTION =
  'Toda a matéria de Matemática do 7.º ao 12.º ano, organizada por ano e por tema, com aulas em vídeo gratuitas, ideias-chave e exercícios. Escolhe o teu ano e a matéria que estás a dar.';

export const metadata: Metadata = {
  title: TITLE,
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
    itemListElement: ANOS.map((ano, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: ano.nome,
      url: absoluteUrl(`/matematica/${ano.slug}`),
    })),
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
                  <span className="mt-1 text-sm font-semibold uppercase tracking-[0.14em] text-[#6b7280]">
                    {ano.numero >= 10 ? 'Matemática A' : 'ano'}
                  </span>
                  <span className="mt-4 text-xs font-semibold text-[#6b7280]">
                    {nVideos > 0
                      ? `${nVideos} ${nVideos === 1 ? 'vídeo' : 'vídeos'} · ${nTemas} ${nTemas === 1 ? 'tema' : 'temas'}`
                      : 'Em breve'}
                  </span>
                </Link>
              );
            })}
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
