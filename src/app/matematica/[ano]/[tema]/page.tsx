import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import GaleriaVideos from '@/components/materias/GaleriaVideos';
import { PageHero, Section } from '@/components/ui';
import { BOTAO_PRINCIPAL, BOTAO_SECUNDARIO } from '@/components/ui/tokens';
import { ANOS, getTema, temasComVideos, thumbnailYoutube, urlYoutube } from '@/data/materias';
import { SOCIAL_URLS, absoluteUrl } from '@/lib/site';

type Params = { ano: string; tema: string };

const YOUTUBE_CANAL = SOCIAL_URLS.find((u) => u.includes('youtube.com')) ?? 'https://youtube.com/@matematicatop1';

export function generateStaticParams(): Params[] {
  return ANOS.flatMap((ano) => temasComVideos(ano).map((t) => ({ ano: ano.slug, tema: t.slug })));
}

export function generateMetadata({ params }: { params: Params }): Metadata {
  const encontrado = getTema(params.ano, params.tema);
  if (!encontrado || encontrado.tema.videos.length === 0) return {};
  const { ano, tema } = encontrado;
  const title = `${tema.nome} ${ano.numero}.º ano: matéria explicada em vídeo`;
  const description = `${tema.resumo} ${tema.videos.length} ${tema.videos.length === 1 ? 'aula em vídeo' : 'aulas em vídeo'}, com as ideias-chave e exercícios para praticar.`;
  const url = absoluteUrl(`/matematica/${ano.slug}/${tema.slug}`);
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${title} | MatemáticaTop`,
      description,
      url,
      images: [{ url: thumbnailYoutube(tema.videos[0].id) }],
    },
  };
}

export default function TemaPage({ params }: { params: Params }) {
  const encontrado = getTema(params.ano, params.tema);
  if (!encontrado || encontrado.tema.videos.length === 0) notFound();
  const { ano, tema } = encontrado;

  const url = absoluteUrl(`/matematica/${ano.slug}/${tema.slug}`);
  const disponiveis = temasComVideos(ano);
  const indice = disponiveis.findIndex((t) => t.slug === tema.slug);
  const anterior = indice > 0 ? disponiveis[indice - 1] : undefined;
  const seguinte = indice < disponiveis.length - 1 ? disponiveis[indice + 1] : undefined;

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Matéria', item: absoluteUrl('/matematica') },
        { '@type': 'ListItem', position: 2, name: ano.nome, item: absoluteUrl(`/matematica/${ano.slug}`) },
        { '@type': 'ListItem', position: 3, name: tema.nome, item: url },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: `${tema.nome} · ${ano.nome}`,
      itemListElement: tema.videos.map((v, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'VideoObject',
          name: v.titulo,
          description: v.descricao,
          thumbnailUrl: thumbnailYoutube(v.id),
          contentUrl: urlYoutube(v.id),
          embedUrl: `https://www.youtube-nocookie.com/embed/${v.id}`,
          url: `${url}#${v.id}`,
        },
      })),
    },
  ];

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#f5f5f5]">
        <PageHero pilula={ano.nome} tomPilula="neutro" titulo={tema.nome} largura="media">
          <nav aria-label="Caminho" className="mt-5 text-sm text-[#6b7280]">
            <Link href="/matematica" className="font-semibold text-[#111111] underline underline-offset-2">
              Matéria por ano
            </Link>
            <span className="mx-2" aria-hidden>/</span>
            <Link href={`/matematica/${ano.slug}`} className="font-semibold text-[#111111] underline underline-offset-2">
              {ano.nome}
            </Link>
            <span className="mx-2" aria-hidden>/</span>
            <span>{tema.nome}</span>
          </nav>
        </PageHero>

        <Section largura="larga">
          <GaleriaVideos videos={tema.videos} />
        </Section>

        <Section fundo="branco" separador largura="larga">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-black/15 bg-[#f5f5f5] p-6">
              <h2 className="text-xl font-black text-[#000000]">Acompanha os vídeos novos</h2>
              <p className="mt-2 text-sm leading-relaxed text-gray-700">
                Os vídeos saem ao ritmo a que a matéria é dada nas escolas. Subscreve o canal para
                os apanhares quando estás a dar o tema.
              </p>
              <a href={YOUTUBE_CANAL} target="_blank" rel="noopener noreferrer" className={`${BOTAO_PRINCIPAL} mt-5`}>
                Subscrever o canal
              </a>
            </div>
            <div className="rounded-2xl border border-black/15 bg-[#f5f5f5] p-6">
              <h2 className="text-xl font-black text-[#000000]">Ainda precisas de ajuda?</h2>
              <p className="mt-2 text-sm leading-relaxed text-gray-700">
                Se o vídeo não chegou, a MatemáticaTop também tem explicações!
              </p>
              <Link href="/explicacoes" className={`${BOTAO_SECUNDARIO} mt-5`}>
                Ver as explicações
              </Link>
            </div>
          </div>

          <nav aria-label="Temas vizinhos" className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-between">
            {anterior ? (
              <Link href={`/matematica/${ano.slug}/${anterior.slug}`} className="group text-sm text-gray-700 hover:text-black">
                <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-[#6b7280]">Tema anterior</span>
                <span className="font-bold underline-offset-2 group-hover:underline">← {anterior.nome}</span>
              </Link>
            ) : (
              <span />
            )}
            {seguinte && (
              <Link href={`/matematica/${ano.slug}/${seguinte.slug}`} className="group text-sm text-gray-700 hover:text-black sm:text-right">
                <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-[#6b7280]">Tema seguinte</span>
                <span className="font-bold underline-offset-2 group-hover:underline">{seguinte.nome} →</span>
              </Link>
            )}
          </nav>
        </Section>

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </main>
      <Footer />
    </>
  );
}
