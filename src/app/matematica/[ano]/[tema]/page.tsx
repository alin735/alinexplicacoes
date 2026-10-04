import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import GaleriaVideos from '@/components/materias/GaleriaVideos';
import { PageHero, Section } from '@/components/ui';
import { BOTAO_PRINCIPAL, BOTAO_SECUNDARIO } from '@/components/ui/tokens';
import { ANOS, anoCurto, listaQueCabe, duracaoIso, getTema, temasComVideos, thumbnailYoutube, todosOsVideos, urlYoutube, videosDoTema, type Ano, type Tema } from '@/data/materias';
import { SOCIAL_URLS, absoluteUrl, tituloSeo } from '@/lib/site';

type Params = { ano: string; tema: string };

const YOUTUBE_CANAL = SOCIAL_URLS.find((u) => u.includes('youtube.com')) ?? 'https://youtube.com/@matematicatop1';

export function generateStaticParams(): Params[] {
  return ANOS.flatMap((ano) => temasComVideos(ano).map((t) => ({ ano: ano.slug, tema: t.slug })));
}

/** A frase do topo da página: "Números complexos de Matemática A do 12.º ano em vídeo". */
function resumo(ano: Ano, tema: Tema) {
  const nivel = ano.numero >= 10 ? `de Matemática A do ${anoCurto(ano)}` : `do ${anoCurto(ano)}`;
  return `${tema.nome} ${nivel} em vídeo`;
}

export function generateMetadata({ params }: { params: Params }): Metadata {
  const encontrado = getTema(params.ano, params.tema);
  if (!encontrado || todosOsVideos(encontrado.tema).length === 0) return {};
  const { ano, tema } = encontrado;
  const { completo } = videosDoTema(tema);
  const curto = `${tema.nome} ${anoCurto(ano)} em vídeo`;
  const title = completo ? `${tema.nome} ${anoCurto(ano)}: toda a matéria em vídeo` : curto;
  const nomesTopicos = videosDoTema(tema).topicos.map((v) => v.titulo);
  const description = nomesTopicos.length
    ? listaQueCabe(`${tema.nome} ${anoCurto(ano)} em vídeo: ${completo ? 'toda a matéria, ' : ''}`, nomesTopicos)
    : `${resumo(ano, tema)}.`;
  const url = absoluteUrl(`/matematica/${ano.slug}/${tema.slug}`);
  return {
    title: completo ? tituloSeo(title, curto) : tituloSeo(curto),
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${title} | MatemáticaTop`,
      description,
      url,
      images: [{ url: thumbnailYoutube(todosOsVideos(tema)[0]) }],
    },
  };
}

export default function TemaPage({ params }: { params: Params }) {
  const encontrado = getTema(params.ano, params.tema);
  if (!encontrado || todosOsVideos(encontrado.tema).length === 0) notFound();
  const { ano, tema } = encontrado;
  const { completo, topicos, exercicios } = videosDoTema(tema);

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
      name: `${tema.nome} | ${anoCurto(ano)}`,
      itemListElement: todosOsVideos(tema).map((v, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'VideoObject',
          name: v.titulo.startsWith(tema.nome)
            ? `${tema.nome} ${anoCurto(ano)}${v.titulo.slice(tema.nome.length)}`
            : `${v.titulo} | ${tema.nome} ${anoCurto(ano)}`,
          description: `${v.titulo}. ${tema.nome}, Matemática do ${anoCurto(ano)}, em vídeo na MatemáticaTop.`,
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
          pilula={ano.nome}
          tomPilula="neutro"
          titulo={`${tema.nome} ${anoCurto(ano)}`}
          descricao={resumo(ano, tema)}
          largura="media"
        >
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

        <Section largura="total">
          <GaleriaVideos
            completo={completo}
            tituloCompleto={`${tema.nome}: toda a matéria`}
            grupos={[
              { titulo: 'Por tópico', videos: topicos },
              { titulo: 'Exercícios resolvidos', videos: exercicios },
            ]}
          />
        </Section>

        <Section fundo="branco" separador largura="larga">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-black/15 bg-[#f5f5f5] p-6">
              <h2 className="text-xl font-black text-[#000000]">Acompanha os vídeos novos</h2>
              <p className="mt-2 text-sm leading-relaxed text-gray-700">
                Subscreve o canal para acederes aos novos vídeos de cada tema.
              </p>
              <a href={YOUTUBE_CANAL} target="_blank" rel="noopener noreferrer" className={`${BOTAO_PRINCIPAL} mt-5`}>
                Subscrever o canal
              </a>
            </div>
            <div className="rounded-2xl border border-black/15 bg-[#f5f5f5] p-6">
              <h2 className="text-xl font-black text-[#000000]">Ainda precisas de ajuda?</h2>
              <p className="mt-2 text-sm leading-relaxed text-gray-700">
                Se ainda tiveres dúvidas, a MatemáticaTop também tem explicações!
              </p>
              <Link href="/explicacoes" className={`${BOTAO_SECUNDARIO} mt-5`}>
                Ver as explicações
              </Link>
            </div>
          </div>

          <nav aria-label="Temas vizinhos" className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-between">
            {anterior ? (
              <Link href={`/matematica/${ano.slug}/${anterior.slug}`} className="group text-sm text-gray-700 hover:text-black">
                <span className="block text-xs font-semibold text-[#6b7280]">Tema anterior</span>
                <span className="font-bold underline-offset-2 group-hover:underline">← {anterior.nome}</span>
              </Link>
            ) : (
              <span />
            )}
            {seguinte && (
              <Link href={`/matematica/${ano.slug}/${seguinte.slug}`} className="group text-sm text-gray-700 hover:text-black sm:text-right">
                <span className="block text-xs font-semibold text-[#6b7280]">Tema seguinte</span>
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
