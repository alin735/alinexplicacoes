import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MathRain from '@/components/MathRain';
import { absoluteUrl } from '@/lib/site';
import CorrecaoClient from '@/components/correcao/CorrecaoClient';
import WaitlistCta from '@/components/correcao/WaitlistCta';

const COMMUNITY_URL = 'https://discord.gg/7eK2QAsp23';
const PATH = '/correcao-prova-matematica-9-ano-2026';

const TITLE = 'Correção do Exame Nacional de Matemática do 9.º Ano 2026 (Resolução Completa)';
const DESCRIPTION =
  'Correção em vídeo do Exame Nacional de Matemática do 9.º ano de 2026, reconstruído pela comunidade MatemáticaTop porque o IAVE não o disponibiliza. Vê a correção em vídeo, questão a questão.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: absoluteUrl(PATH) },
  keywords: [
    'correção exame nacional matemática 9 ano 2026',
    'resolução exame nacional matemática 9 ano 2026',
    'exame nacional matemática 9 ano 2026',
    'correção exame matemática 9 ano 2026',
    'correção exame matemática nono ano',
  ],
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: absoluteUrl(PATH),
    type: 'article',
    locale: 'pt_PT',
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function CorrecaoProvaMat9Page() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-white">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-black/15 bg-white px-4 pb-12 pt-32">
          <MathRain speed="fast" />
          <div className="relative z-10 max-w-3xl mx-auto text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#f59e0b]/40 bg-[#fff7ed] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#b45309] mb-4">
              Exame Nacional de 22 de junho de 2026
            </span>
            <h1 className="text-3xl sm:text-5xl font-black text-[#000000] mb-4">
              Correção do Exame Nacional de Matemática do 9.º Ano 2026
            </h1>
            <p className="text-gray-700 max-w-2xl mx-auto text-base sm:text-lg">
              <strong className="text-[#000000]">Resolução completa</strong>, questão a questão. A
              correção que o IAVE não disponibiliza, reconstruída pela nossa comunidade.
            </p>
          </div>
        </section>

        {/* Introdução */}
        <section className="px-4 pt-10">
          <div className="max-w-3xl mx-auto">
            <div className="prose-sm text-gray-700 space-y-4 text-[15px] sm:text-base leading-relaxed">
              <p>
                No dia <strong>22 de junho de 2026</strong> realizou-se o Exame Nacional de Matemática
                do 9.º ano. Este exame é o culminar do 3.º ciclo e avalia os conhecimentos dos alunos
                antes de seguirem para o secundário.
              </p>
              <p>
                Desde 2025, com a passagem das provas finais para o formato digital, o{' '}
                <strong>IAVE deixou de disponibilizar publicamente o enunciado do Exame Nacional</strong>{' '}
                do 9.º ano. Na prática, isto significa que, depois de fazerem a prova, os alunos ficam
                sem forma de rever o enunciado ou de confirmar as suas respostas.
              </p>
              <p>
                Foi precisamente por isso que decidimos fazer isto. Com o intuito de ajudar os alunos a
                estudarem e a verem a correção do seu exame, juntámos os contributos de dezenas de
                alunos que fizeram a prova e conseguimos{' '}
                <strong>elaborar a correção completa do exame, questão a questão</strong>.
                Se quiseres ajudar a melhorá-la ou tirar dúvidas, entra na{' '}
                <a
                  href={COMMUNITY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-black underline underline-offset-4 hover:text-[#5865F2]"
                >
                  nossa comunidade aqui
                </a>
                .
              </p>
              <p className="text-sm text-gray-500">
                Nota: esta é uma reconstrução não oficial feita pela MatemáticaTop e pela sua
                comunidade. Pode conter pequenas diferenças face à prova original.
              </p>
            </div>
          </div>
        </section>

        {/* Funil + documentos */}
        <section className="px-4 py-10">
          <div className="max-w-3xl mx-auto">
            <CorrecaoClient
              badge="Correção em vídeo, reconstruída pela comunidade"
              heading="Vê a correção do exame em vídeo"
              subtext="Reconstruímos o Exame Nacional de Matemática do 9.º ano de 2026 com a ajuda da comunidade. Clica em baixo para abrires a correção em vídeo, questão a questão."
              ctaLabel="Abrir correção em vídeo →"
              revealedHeading="Correção do exame em vídeo"
              videoEmbed="https://www.youtube.com/embed/UqBaYSoR3RE"
              videoWatch="https://youtu.be/UqBaYSoR3RE"
              videoTitle="Correção do Exame Nacional de Matemática do 9.º ano 2026 em vídeo"
            />
          </div>
        </section>

        {/* Bloco explicações (suave) */}
        <section className="px-4 pb-16">
          <div className="max-w-3xl mx-auto rounded-2xl border border-black/15 bg-gray-50 p-6 sm:p-8 text-center">
            <h2 className="text-xl sm:text-2xl font-black text-[#000000]">
              Vais para o secundário? As Explicações Top estão a chegar
            </h2>
            <p className="mt-2 text-gray-600 text-sm sm:text-base max-w-xl mx-auto">
              Quando as aulas começarem, vamos começar com explicações de qualidade para praticamente
              todas as disciplinas, a um preço acessível. Entra na lista de espera e és das primeiras
              pessoas a saber.
            </p>
            <WaitlistCta />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
