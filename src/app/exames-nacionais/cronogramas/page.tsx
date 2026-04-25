import type { Metadata } from 'next';
import Footer from '@/components/Footer';
import MathRain from '@/components/MathRain';
import Navbar from '@/components/Navbar';
import CronogramaPlanner from '@/components/CronogramaPlanner';
import { absoluteUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Cronogramas de Estudo',
  description:
    'Escolhe entre Matemática A e 9.º ano e abre um cronograma de preparação ajustado ao tempo que tens e ao tema em que tens mais dificuldade.',
  alternates: {
    canonical: absoluteUrl('/exames-nacionais/cronogramas'),
  },
  openGraph: {
    title: 'Cronogramas de Estudo | MatemáticaTop',
    description:
      'Escolhe entre Matemática A e 9.º ano e abre um cronograma de preparação ajustado ao tempo que tens e ao tema em que tens mais dificuldade.',
    url: absoluteUrl('/exames-nacionais/cronogramas'),
  },
};

export default function CronogramasPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#f5f5f5]">
        <section className="relative bg-white border-b border-black/15 px-4 pb-12 pt-32 overflow-hidden">
          <MathRain speed="fast" />
          <div className="relative z-10 max-w-6xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl font-black text-[#000000] mb-2">
              Cronogramas
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Escolhe entre Matemática A e 9.º ano. Depois, seleciona quando vais começar a estudar e o tema em que sentes mais dificuldade.
            </p>
          </div>
        </section>

        <section className="px-4 py-14">
          <div className="max-w-6xl mx-auto">
            <CronogramaPlanner />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
