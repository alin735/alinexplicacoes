import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MathRain from '@/components/MathRain';
import { absoluteUrl } from '@/lib/site';
import Quiz from './Quiz';

const PATH = '/secundario';

const TITLE = 'Que área do secundário escolher? Teste de afinidade (9.º ano)';
const DESCRIPTION =
  'Não sabes que área escolher no secundário? Responde a 8 perguntas e descobre a tua afinidade com Ciências e Tecnologias, Ciências Socioeconómicas, Línguas e Humanidades, Artes Visuais e Cursos Profissionais.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: absoluteUrl(PATH) },
  keywords: [
    'que área escolher no secundário',
    'qual área do secundário',
    'escolher curso secundário 9 ano',
    'teste área secundário',
    'orientação vocacional 9 ano',
  ],
  openGraph: {
    title: 'Que área do secundário é a tua? | MatemáticaTop',
    description: DESCRIPTION,
    url: absoluteUrl(PATH),
    type: 'website',
    locale: 'pt_PT',
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function SecundarioPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#f5f5f5]">
        {/* Hero */}
        <div className="relative overflow-hidden border-b border-black/15 bg-white px-4 pb-12 pt-32">
          <MathRain speed="fast" />
          <div className="relative z-10 max-w-3xl mx-auto text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#f59e0b]/40 bg-[#fff7ed] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#b45309] mb-4">
              Orientação vocacional · 9.º ano
            </span>
            <h1 className="text-4xl sm:text-5xl font-black text-[#000000] mb-3">
              Que área do secundário é a tua?
            </h1>
            <p className="text-gray-700 max-w-2xl mx-auto text-base sm:text-lg">
              Responde a 8 perguntas rápidas e descobre a tua{' '}
              <strong className="text-[#000000]">afinidade com cada área</strong>, com as disciplinas
              e as saídas de cada uma. É uma ferramenta de orientação para te ajudar a refletir.
            </p>
          </div>
        </div>

        {/* Ferramenta */}
        <section className="px-4 py-10">
          <div className="max-w-2xl mx-auto">
            <Quiz />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
