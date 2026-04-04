'use client';

import type { ReactNode } from 'react';
import { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MathRain from '@/components/MathRain';

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

function PlanoMotionPreview() {
  return (
    <div className="w-full">
      <div className="group relative w-full aspect-video overflow-hidden">
        <PreviewCard
          lines={5}
          bullets
          className="left-[22%] top-[20%] w-[37%] h-[68%] -rotate-[14deg] z-10 group-hover:left-[4%] group-hover:top-[16%] group-hover:rotate-0 group-hover:scale-[1.01]"
        />
        <PreviewCard
          title="Plano Personalizado"
          lines={4}
          className="right-[14%] top-[8%] w-[48%] h-[82%] z-20 group-hover:right-[2%]"
        />
      </div>
    </div>
  );
}

type InstructionMediaConfig =
  | { type: 'video'; src: string; ariaLabel: string }
  | { type: 'cronograma-motion' }
  | { type: 'plano-motion' };

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
        {media.type === 'plano-motion' && <PlanoMotionPreview />}
      </div>
    </section>
  );
}

export default function Home() {
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
                href="/marcar"
                className="group relative px-8 py-4 bg-[#000000] text-white font-bold rounded-2xl text-lg shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden border border-black"
              >
                <span className="relative z-10">Explicações</span>
                <div className="absolute inset-0 bg-gradient-to-r from-[#111111] to-[#2a2a2a] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="absolute inset-0 flex items-center justify-center text-white font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                  Explicações
                </span>
              </Link>

              <Link
                href="/exames-nacionais"
                className="px-8 py-4 bg-white text-[#111111] font-bold rounded-2xl text-lg border-2 border-black/60 hover:bg-black/5 hover:border-black hover:-translate-y-1 transition-all duration-300"
              >
                Explorar exames nacionais
              </Link>
            </div>
          </div>
        </section>

        <section className="px-4 py-14 border-b border-black/10 bg-white">
          <div className="max-w-5xl mx-auto grid gap-8 lg:grid-cols-[1fr_320px] items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-[#000000] mb-4">
                O que é a MatemáticaTop?
              </h2>
              <p className="text-gray-700 text-base sm:text-lg leading-relaxed">
                A MatemáticaTop é um projeto pensado para ajudar alunos a gostar mais de Matemática, através de recursos que facilitem os seus estudos.
              </p>
              <p className="text-gray-700 text-base sm:text-lg leading-relaxed mt-4">
                Aqui podes marcar as tuas explicações, preparar-te para o Exame Nacional e consultar recursos para estudares para os teus testes.
              </p>
            </div>
            <div className="mx-auto">
              <img
                src="/images/home/matematicatop-cartaz.png"
                alt="Ilustração MatemáticaTop"
                className="w-full max-w-[280px] object-contain"
              />
            </div>
          </div>
        </section>

        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
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
                <>Vai à secção <Link href="/marcar" className="font-semibold text-[#111111] underline underline-offset-2">Explicações</Link>.</>,
                'Escolhe o tema, o dia e a hora.',
                'Tem aula.',
              ]}
              media={{
                type: 'video',
                src: LANDING_DEMO_VIDEO_SRC,
                ariaLabel: 'Vídeo de demonstração da marcação de explicação',
              }}
              reverse
            />

            <InstructionSection
              title="Recebe o teu plano personalizado"
              subtitle="Depois da primeira aula, podes acede a um plano ajustado às tuas dificuldades e aos teus objetivos."
              steps={[
                'Tem aula com o Alin.',
                <>Vai à secção <Link href="/notas" className="font-semibold text-[#111111] underline underline-offset-2">Notas</Link>.</>,
                'Cria o teu plano personalizado.',
              ]}
              media={{ type: 'plano-motion' }}
            />

            <InstructionSection
              title="Revê o material da página inicial do site"
              subtitle="Depois de cada aula, podes rever os materiais e consolidar o que foi trabalhado."
              steps={[
                <>Vai à secção <Link href="/aulas" className="font-semibold text-[#111111] underline underline-offset-2">Minhas aulas</Link>.</>,
                'Procura a respetiva aula.',
                'Revê os conteúdos.',
              ]}
              media={{
                type: 'video',
                src: REVIEW_MATERIAL_VIDEO_SRC,
                ariaLabel: 'Vídeo de demonstração da revisão de material',
              }}
              reverse
            />
          </div>
        </section>

        <section className="px-4 pb-20">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#000000] mb-8">Perguntas frequentes</h2>
            <div className="grid gap-4">
              {[
                {
                  question: 'Como marco uma explicação?',
                  answer: (
                    <>
                      Vai à secção <Link href="/marcar" className="font-semibold text-[#111111] underline underline-offset-2">Explicações</Link>, escolhe o tema, o dia e a hora disponíveis, e agenda uma aula.
                    </>
                  ),
                },
                {
                  question: 'Quais são os preços das explicações?',
                  answer: (
                    <>
                      O valor de uma explicação (1 hora) varia entre 5€ e 13€, de acordo com o número de alunos que participarem. Podem ser encontradas mais informações na secção <Link href="/marcar" className="font-semibold text-[#111111] underline underline-offset-2">Explicações</Link>.
                    </>
                  ),
                },
                {
                  question: 'Posso usar o site para me preparar para o exame?',
                  answer: (
                    <>
                      Sim. A secção <Link href="/exames-nacionais" className="font-semibold text-[#111111] underline underline-offset-2">Exames Nacionais</Link> junta cronogramas, informação sobre os temas e exercícios resolvidos.
                    </>
                  ),
                },
                {
                  question: 'Onde vejo as minhas aulas e materiais?',
                  answer: (
                    <>
                      Na secção <Link href="/aulas" className="font-semibold text-[#111111] underline underline-offset-2">Minhas aulas</Link> podes rever o que foi trabalhado e consultar os materiais associados a cada aula.
                    </>
                  ),
                },
                {
                  question: 'O que encontro na secção Notas?',
                  answer: (
                    <>
                      Na secção <Link href="/notas" className="font-semibold text-[#111111] underline underline-offset-2">Notas</Link> podes acompanhar o teu progresso e aceder a um plano personalizado depois da primeira aula.
                    </>
                  ),
                },
              ].map((item) => (
                <details key={item.question} className="rounded-2xl border border-black/10 bg-white px-6 py-5 shadow-[0_18px_45px_rgba(0,0,0,0.06)]">
                  <summary className="cursor-pointer list-none text-lg font-semibold text-[#111111]">
                    {item.question}
                  </summary>
                  <div className="mt-3 text-gray-600 leading-relaxed">{item.answer}</div>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      {showBookingCta && (
        <div className="fixed bottom-5 right-5 z-[72] max-w-sm w-[calc(100%-2.5rem)] bg-white rounded-2xl shadow-2xl border border-[#000000]/20 p-4 animate-fade-in-up">
          <button
            onClick={() => setShowBookingCta(false)}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
            aria-label="Fechar"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <p className="text-[#000000] font-semibold text-sm mb-1">Queres começar já?</p>
          <p className="text-gray-500 text-sm mb-4">
            Marca a tua primeira explicação e desbloqueia o teu plano personalizado.
          </p>
          <Link
            href="/marcar"
            className="inline-flex items-center justify-center w-full px-4 py-2.5 bg-gradient-to-r from-[#111111] to-[#2a2a2a] text-white rounded-xl font-semibold text-sm hover:shadow-lg transition-all"
          >
            Explicações
          </Link>
        </div>
      )}

      <Footer />
    </>
  );
}
