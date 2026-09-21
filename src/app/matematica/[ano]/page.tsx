import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { PageHero, Section } from '@/components/ui';
import { BOTAO_SECUNDARIO } from '@/components/ui/tokens';
import { ANOS, contarVideos, getAno } from '@/data/materias';
import { absoluteUrl } from '@/lib/site';

type Params = { ano: string };

export function generateStaticParams(): Params[] {
  return ANOS.map((a) => ({ ano: a.slug }));
}

export function generateMetadata({ params }: { params: Params }): Metadata {
  const ano = getAno(params.ano);
  if (!ano) return {};
  const nivel = ano.numero >= 10 ? `Matemática A do ${ano.numero}.º ano` : `Matemática do ${ano.numero}.º ano`;
  const title = `${nivel}: toda a matéria por tema, em vídeo`;
  const description = `${ano.descricao} Aulas em vídeo gratuitas, tema a tema, com ideias-chave e exercícios.`;
  return {
    title,
    description,
    alternates: { canonical: absoluteUrl(`/matematica/${ano.slug}`) },
    openGraph: { title: `${title} | MatemáticaTop`, description, url: absoluteUrl(`/matematica/${ano.slug}`) },
  };
}

export default function AnoPage({ params }: { params: Params }) {
  const ano = getAno(params.ano);
  if (!ano) notFound();

  const nVideos = contarVideos(ano);
  const disponiveis = ano.temas.filter((t) => t.videos.length > 0);
  const emBreve = ano.temas.filter((t) => t.videos.length === 0);

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Matéria', item: absoluteUrl('/matematica') },
        { '@type': 'ListItem', position: 2, name: ano.nome, item: absoluteUrl(`/matematica/${ano.slug}`) },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: `Temas de ${ano.nome}`,
      itemListElement: disponiveis.map((t, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: t.nome,
        url: absoluteUrl(`/matematica/${ano.slug}/${t.slug}`),
      })),
    },
  ];

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#f5f5f5]">
        <PageHero
          pilula={nVideos > 0 ? `${nVideos} ${nVideos === 1 ? 'aula em vídeo' : 'aulas em vídeo'}` : 'Em breve'}
          tomPilula={nVideos > 0 ? 'confirma' : 'neutro'}
          titulo={ano.numero >= 10 ? `Matemática A · ${ano.numero}.º ano` : `Matemática do ${ano.numero}.º ano`}
          descricao={ano.resumo}
          largura="media"
        >
          <nav aria-label="Caminho" className="mt-5 text-sm text-[#6b7280]">
            <Link href="/matematica" className="font-semibold text-[#111111] underline underline-offset-2">
              Matéria por ano
            </Link>
            <span className="mx-2" aria-hidden>
              /
            </span>
            <span>{ano.nome}</span>
          </nav>
        </PageHero>

        <Section largura="larga" titulo="Os temas do ano">
          <ol className="grid gap-4 sm:grid-cols-2">
            {ano.temas.map((tema, i) => {
              const tem = tema.videos.length > 0;
              const inner = (
                <>
                  <div className="flex items-start gap-4">
                    <span
                      className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                        tem ? 'bg-[#111111] text-white' : 'bg-black/10 text-[#6b7280]'
                      }`}
                    >
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className={`text-lg font-black leading-snug ${tem ? 'text-[#000000]' : 'text-[#6b7280]'}`}>{tema.nome}</h3>
                      <p className="mt-1.5 text-xs font-semibold text-[#6b7280]">
                        {tem ? `${tema.videos.length} ${tema.videos.length === 1 ? 'vídeo' : 'vídeos'}` : 'Em breve'}
                      </p>
                    </div>
                  </div>
                </>
              );
              return (
                <li key={tema.slug}>
                  {tem ? (
                    <Link
                      href={`/matematica/${ano.slug}/${tema.slug}`}
                      className="group block h-full rounded-2xl border border-black/15 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                      {inner}
                    </Link>
                  ) : (
                    <div className="h-full rounded-2xl border border-dashed border-black/15 bg-white/60 p-5">{inner}</div>
                  )}
                </li>
              );
            })}
          </ol>
          {emBreve.length > 0 && (
            <p className="mt-6 text-sm text-[#6b7280]">Os temas a tracejado ainda não têm vídeo.</p>
          )}
        </Section>

        <Section fundo="branco" separador largura="estreita">
          <div className="rounded-2xl border border-black/15 bg-[#f5f5f5] p-6 text-center sm:p-8">
            <h2 className="text-2xl font-black text-[#000000]">Precisas de ajuda nesta matéria?</h2>
            <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-gray-700">
              Os vídeos são gratuitos e cobrem a matéria toda. Se precisares de alguém a explicar-te
              a ti, ao teu ritmo, há explicações online do 7.º ao 12.º ano.
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
