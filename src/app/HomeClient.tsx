'use client';

import type { ReactNode } from 'react';
import { useEffect, useId, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MathRain from '@/components/MathRain';
import {
  BOTAO_PRINCIPAL_GRANDE,
  BOTAO_SECUNDARIO,
  BOTAO_SECUNDARIO_GRANDE,
  Faq,
  Pill,
  Section,
  type Pergunta,
} from '@/components/ui';

/** Um artigo do blog, já reduzido ao que a página inicial mostra. */
export type ArtigoDestaque = {
  slug: string;
  titulo: string;
  resumo: string;
  categoria: string;
  tempoLeitura: string;
  imagem: string;
  imagemAlt: string;
};

const LANDING_DEMO_VIDEO_SRC = '/videos/landing-demo.mp4';
const REVIEW_MATERIAL_VIDEO_SRC = '/videos/reve-material.mp4';
const ACTIVE_LANDING_VIDEO_EVENT = 'landing:active-video';

function VideoPreview({ src, ariaLabel }: { src: string; ariaLabel: string }) {
  const videoId = useId();
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const notifyVideoStarted = () => {
    window.dispatchEvent(
      new CustomEvent<string>(ACTIVE_LANDING_VIDEO_EVENT, {
        detail: videoId,
      }),
    );
  };

  useEffect(() => {
    const handleActiveVideoChange = (event: Event) => {
      const customEvent = event as CustomEvent<string>;
      if (customEvent.detail === videoId) return;

      if (videoRef.current && !videoRef.current.paused) {
        videoRef.current.pause();
      }
    };

    window.addEventListener(ACTIVE_LANDING_VIDEO_EVENT, handleActiveVideoChange as EventListener);
    return () => window.removeEventListener(ACTIVE_LANDING_VIDEO_EVENT, handleActiveVideoChange as EventListener);
  }, [videoId]);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          window.dispatchEvent(
            new CustomEvent<string>(ACTIVE_LANDING_VIDEO_EVENT, {
              detail: videoId,
            }),
          );
          void videoElement.play().catch(() => undefined);
          return;
        }

        videoElement.pause();
      },
      { threshold: 0.55 },
    );

    observer.observe(videoElement);

    return () => observer.disconnect();
  }, [videoId]);

  return (
    <div className="w-full">
      <div className="w-full aspect-video rounded-2xl overflow-hidden bg-[#f5f5f5] shadow-xl border border-black/20">
        <video
          ref={videoRef}
          src={src}
          controls
          muted
          preload="metadata"
          playsInline
          aria-label={ariaLabel}
          onPlay={notifyVideoStarted}
          className="h-full w-full object-cover"
        />
      </div>
    </div>
  );
}

function PreviewCard({
  title,
  lines,
  bullets = false,
  className,
}: {
  title?: string;
  lines: number;
  bullets?: boolean;
  className: string;
}) {
  const lineWidths = ['w-[80%]', 'w-[72%]', 'w-[84%]', 'w-[76%]', 'w-[68%]'];

  return (
    <div
      className={`absolute overflow-hidden rounded-[18px] bg-white shadow-[8px_8px_0_rgba(0,0,0,0.08)] transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${className}`}
    >
      {title && (
        <div className="h-[22%] bg-[#111111] flex items-center justify-center">
          <span className="text-white font-bold text-base sm:text-xl">{title}</span>
        </div>
      )}
      <div className={`px-3 sm:px-5 ${title ? 'py-3 sm:py-4' : 'py-5 sm:py-6'} space-y-3 sm:space-y-4`}>
        {Array.from({ length: lines }).map((_, index) => (
          <div key={`${title ?? 'card'}-line-${index}`} className={`flex items-center ${bullets ? 'gap-2.5' : ''}`}>
            {bullets && <span className="w-2.5 h-2.5 rounded-full bg-[#111111] flex-shrink-0" />}
            <div
              className={`${lineWidths[index % lineWidths.length]} h-[3px] rounded-full bg-[#111111] ${
                bullets ? '' : 'mx-auto'
              }`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function CronogramaMotionPreview() {
  return (
    <div className="w-full">
      <div className="group relative w-full aspect-video overflow-hidden">
        <PreviewCard
          title="2 meses"
          lines={4}
          className="left-[20%] top-[23%] w-[33%] h-[64%] -rotate-[10deg] scale-[0.96] z-10 group-hover:left-[2%] group-hover:top-[25%] group-hover:rotate-0 group-hover:scale-[0.92]"
        />
        <PreviewCard
          title="3 meses"
          lines={5}
          className="left-1/2 -translate-x-1/2 top-[8%] w-[40%] h-[80%] z-20"
        />
        <PreviewCard
          title="1 mês"
          lines={4}
          className="right-[20%] top-[23%] w-[33%] h-[64%] rotate-[10deg] scale-[0.96] z-10 group-hover:right-[2%] group-hover:top-[25%] group-hover:rotate-0 group-hover:scale-[0.92]"
        />
      </div>
    </div>
  );
}

type InstructionMediaConfig =
  | { type: 'video'; src: string; ariaLabel: string }
  | { type: 'cronograma-motion' };

type InstructionSectionProps = {
  title: string;
  subtitle: string;
  steps: ReactNode[];
  media: InstructionMediaConfig;
  reverse?: boolean;
};

function InstructionSection({
  title,
  subtitle,
  steps,
  media,
  reverse = false,
}: InstructionSectionProps) {
  return (
    <section className="py-14">
      <div className={`grid lg:grid-cols-2 gap-8 lg:gap-10 items-center ${reverse ? 'lg:[&>*:first-child]:order-2' : ''}`}>
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#000000] mb-3">{title}</h2>
          <p className="text-gray-600 mb-6 max-w-xl">{subtitle}</p>
          <ol className="space-y-3">
            {steps.map((step, index) => (
              <li key={index} className="flex items-start gap-3 text-gray-700">
                <span className="w-7 h-7 rounded-full bg-[#000000]/15 text-[#111111] text-sm font-bold flex items-center justify-center flex-shrink-0">
                  {index + 1}
                </span>
                <span className="pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
        </div>
        {media.type === 'video' && <VideoPreview src={media.src} ariaLabel={media.ariaLabel} />}
        {media.type === 'cronograma-motion' && <CronogramaMotionPreview />}
      </div>
    </section>
  );
}

// ─── Perguntas frequentes ────────────────────────────────────────────────────
// Vivem fora do componente para não serem reconstruídas a cada render e para
// ficarem fáceis de editar sem mexer no resto da página.
const PERGUNTAS: Pergunta[] = [
  {
    pergunta: 'Como marco uma explicação?',
    resposta: (
      <>
        Vai à secção{' '}
        <Link href="/explicacoes" className="font-semibold text-[#111111] underline underline-offset-2">
          Explicações
        </Link>
        , deixa o teu contacto e uma mensagem com o que precisas. Depois falo contigo para
        combinarmos o explicador, o horário e o plano. Pedir é gratuito e não te compromete a nada.
      </>
    ),
  },
  {
    pergunta: 'Quanto custam as explicações?',
    resposta: (
      <>
        As individuais são 17€ por hora. Em grupo, o preço por aluno desce até 8€, conforme
        o número de colegas. Tens a tabela
        completa na página das{' '}
        <Link href="/explicacoes" className="font-semibold text-[#111111] underline underline-offset-2">
          Explicações
        </Link>
        .
      </>
    ),
  },
  {
    pergunta: 'As aulas são online ou presenciais?',
    resposta:
      'As explicações são online, num quadro branco partilhado onde escrevemos os dois ao mesmo tempo. Não precisas de instalar nada nem de te deslocar, e ficas com o que foi escrito na aula.',
  },
  {
    pergunta: 'Que anos e disciplinas é que dão?',
    resposta: (
      <>
        Matemática do 7.º ao 12.º ano, incluindo preparação para o Exame Nacional. As{' '}
        <Link href="/explicacoes-top" className="font-semibold text-[#111111] underline underline-offset-2">
          Explicações Top
        </Link>{' '}
        vão alargar isto a praticamente todas as disciplinas.
      </>
    ),
  },
  {
    pergunta: 'Posso usar o site para me preparar para o exame?',
    resposta: (
      <>
        Sim, e é gratuito. A secção{' '}
        <Link href="/exames-nacionais" className="font-semibold text-[#111111] underline underline-offset-2">
          Exames Nacionais
        </Link>{' '}
        tem cronogramas de estudo e mostra-te com que frequência cada tema saiu no exame entre 2016
        e 2025.
      </>
    ),
  },
  {
    pergunta: 'Onde vejo as correções das provas do 9.º ano?',
    resposta: (
      <>
        Em{' '}
        <Link href="/correcoes" className="font-semibold text-[#111111] underline underline-offset-2">
          Correções
        </Link>
        . Como o IAVE deixou de disponibilizar os enunciados do 9.º ano, reconstruímo-los com a
        comunidade e resolvemo-los em vídeo, questão a questão.
      </>
    ),
  },
];

export default function Home({ artigos = [] }: { artigos?: ArtigoDestaque[] }) {
  const [mounted, setMounted] = useState(false);
  const [showBookingCta, setShowBookingCta] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const timeoutId = setTimeout(() => setShowBookingCta(true), 8000);
    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <>
      <Navbar />
      <main>
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#f5f5f5] border-b border-black/15">
          <MathRain />
          <div className="absolute inset-0">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[620px] h-[620px] bg-black/5 rounded-full blur-3xl animate-float" />
          </div>

          <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
            <div
              className={`transition-all duration-1000 ${
                mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
            >
              <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-[#000000] mb-4 leading-tight">
                <span className="bg-gradient-to-r from-[#000000] to-[#3a3a3a] bg-clip-text text-transparent">
                  A Matemática é Top
                </span>
              </h1>
              <p className="text-base sm:text-lg text-gray-700 mb-12 max-w-2xl mx-auto leading-relaxed">
                Explicações online, materiais organizados e ferramentas de preparação para o Exame Nacional.
              </p>
            </div>

            <div
              className={`flex flex-col sm:flex-row gap-4 justify-center transition-all duration-1000 delay-300 ${
                mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
            >
              <Link
                href="/explicacoes"
                className={BOTAO_PRINCIPAL_GRANDE}
              >
                Explicações
              </Link>

              <Link
                href="/exames-nacionais"
                className={BOTAO_SECUNDARIO_GRANDE}
              >
                Explorar exames nacionais
              </Link>
            </div>
          </div>
        </section>

        <Section fundo="branco" separador largura="larga">
          <div className="grid items-center gap-8 lg:grid-cols-[1fr_320px]">
            <div>
              <h2 className="mb-4 text-3xl font-black text-[#000000] sm:text-4xl">
                O que é a MatemáticaTop?
              </h2>
              <p className="text-base leading-relaxed text-gray-700 sm:text-lg">
                A MatemáticaTop é um projeto pensado para ajudar alunos a gostar mais de Matemática, através de recursos que facilitem os seus estudos.
              </p>
              <p className="mt-4 text-base leading-relaxed text-gray-700 sm:text-lg">
                Aqui podes marcar as tuas explicações, preparar-te para o Exame Nacional e consultar recursos para estudares para os teus testes.
              </p>
            </div>
            <div className="mx-auto">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/home/matematicatop-cartaz.png"
                alt="Ilustração MatemáticaTop"
                className="w-full max-w-[280px] object-contain"
              />
            </div>
          </div>
        </Section>

        <section className="px-4 py-14">
          <div className="mx-auto max-w-6xl">
            <InstructionSection
              title="Explora os teus recursos para o exame"
              subtitle="Na secção de Exames Nacionais encontras ferramentas para organizar o teu estudo para o exame."
              steps={[
                <>Vai à secção <Link href="/exames-nacionais" className="font-semibold text-[#111111] underline underline-offset-2">Exames Nacionais</Link>.</>,
                'Escolhe a ferramenta de que precisas.',
                'Estuda com o recurso mais adequado.',
              ]}
              media={{ type: 'cronograma-motion' }}
            />

            <InstructionSection
              title="Marca uma explicação com o Alin"
              subtitle="Agenda uma aula focada na matéria em que precisas de apoio."
              steps={[
                <>Vai à secção <Link href="/explicacoes" className="font-semibold text-[#111111] underline underline-offset-2">Explicações</Link>.</>,
                'Deixa o teu contacto e o que precisas.',
                'Combinamos tudo e tens aula.',
              ]}
              media={{
                type: 'video',
                src: LANDING_DEMO_VIDEO_SRC,
                ariaLabel: 'Vídeo de demonstração da marcação de explicação',
              }}
              reverse
            />
          </div>
        </section>

        {/* Explicações Top */}
        <Section largura="larga">
          <div className="overflow-hidden rounded-2xl border border-black/15 bg-[#111111] px-6 py-10 shadow-sm sm:px-10">
            <div className="grid items-center gap-8 lg:grid-cols-[1fr_auto]">
              <div>
                <Pill tom="destaque" sobretitulo>
                  Em breve · Lista de espera
                </Pill>
                <h2 className="mt-4 text-3xl font-black text-white sm:text-4xl">
                  As Explicações Top estão a chegar
                </h2>
                <p className="mt-3 max-w-xl text-base leading-relaxed text-white/70">
                  Explicações de qualidade para praticamente todas as disciplinas, a um preço
                  acessível. Entra na lista de espera e és das primeiras pessoas a saber quando
                  abrirmos as vagas.
                </p>
              </div>
              <Link
                href="/explicacoes-top"
                className="inline-flex w-fit items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-sm font-bold text-[#000000] transition-all hover:-translate-y-0.5 hover:bg-[#f5f5f5]"
              >
                Entrar na lista de espera
                <span aria-hidden>→</span>
              </Link>
            </div>
          </div>
        </Section>

        {/* Últimos artigos */}
        {artigos.length > 0 && (
          <Section
            titulo="Do blog"
            descricao="Artigos com estratégias, informação sobre o exame e métodos de estudo."
            largura="larga"
          >
            <div className="grid gap-6 md:grid-cols-3">
              {artigos.map((artigo) => (
                <Link
                  key={artigo.slug}
                  href={`/blog/${artigo.slug}`}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-black/15 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="relative aspect-[16/9] overflow-hidden bg-[#fafafa]">
                    <Image
                      src={artigo.imagem}
                      alt={artigo.imagemAlt}
                      fill
                      className="object-contain p-4 transition-transform duration-500 group-hover:scale-[1.02]"
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6b7280]">
                      <span>{artigo.categoria}</span>
                      <span aria-hidden>·</span>
                      <span>{artigo.tempoLeitura}</span>
                    </div>
                    <h3 className="mb-2 text-lg font-black leading-snug text-[#000000]">
                      {artigo.titulo}
                    </h3>
                    <p className="flex-1 text-sm leading-relaxed text-gray-600">{artigo.resumo}</p>
                  </div>
                </Link>
              ))}
            </div>
            <div className="mt-8 flex justify-center">
              <Link
                href="/blog"
                className={BOTAO_SECUNDARIO}
              >
                Ver todos os artigos
                <span aria-hidden>→</span>
              </Link>
            </div>
          </Section>
        )}

        {/* Avaliações no Trustpilot */}
        <Section fundo="branco" separador largura="larga" className="border-t border-black/15">
          <div className="text-center">
            <h2 className="text-2xl font-black text-[#000000] sm:text-3xl">Gostas da MatemáticaTop?</h2>
            <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-gray-700 sm:text-lg">
              A tua opinião ajuda outros alunos a confiar no nosso trabalho e ajuda-nos a melhorar.
              Deixa uma avaliação no Trustpilot, leva menos de um minuto.
            </p>
            <a
              href="https://www.trustpilot.com/evaluate/matematica.top"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Avalia-nos no Trustpilot"
              className="mt-6 inline-flex items-center gap-2.5 rounded-2xl border border-black/15 bg-white px-7 py-4 text-lg font-black text-[#000000] shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <span>Avalia-nos no</span>
              <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
                <path
                  fill="#00B67A"
                  d="M12 1.6l2.95 6.37 6.85.72-5.08 4.62 1.37 6.75L12 17.2l-6.06 3.36 1.37-6.75L2.23 9.19l6.85-.72z"
                />
              </svg>
              <span>Trustpilot</span>
            </a>
          </div>
        </Section>

        <Section titulo="Perguntas frequentes" largura="larga">
          <Faq perguntas={PERGUNTAS} />
        </Section>
      </main>

      {showBookingCta && (
        <div className="fixed bottom-5 right-5 z-[72] w-[calc(100%-2.5rem)] max-w-sm animate-fade-in-up rounded-2xl border border-black/15 bg-white p-4 shadow-2xl">
          <button
            onClick={() => setShowBookingCta(false)}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
            aria-label="Fechar"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <p className="mb-1 text-sm font-semibold text-[#000000]">Queres começar já?</p>
          <p className="mb-4 text-sm text-gray-500">
            Diz-nos o que precisas e combinamos a tua primeira explicação.
          </p>
          <Link
            href="/explicacoes"
            className="inline-flex w-full items-center justify-center rounded-xl bg-[#111111] px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#2a2a2a]"
          >
            Explicações
          </Link>
        </div>
      )}

      <Footer />
    </>
  );
}
