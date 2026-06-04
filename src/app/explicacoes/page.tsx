import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MathRain from '@/components/MathRain';
import { absoluteUrl } from '@/lib/site';
import LeadSection from './LeadSection';

export const metadata: Metadata = {
  title: 'Explicações de Matemática',
  description:
    'Explicações de Matemática individuais e em grupo. Diz-nos o que precisas e ajudamos-te a escolher o explicador, o horário e o plano certos para ti.',
  alternates: {
    canonical: absoluteUrl('/explicacoes'),
  },
  openGraph: {
    title: 'Explicações de Matemática | MatemáticaTop',
    description:
      'Diz-nos o que precisas e ajudamos-te a escolher o explicador, o horário e o plano certos para ti.',
    url: absoluteUrl('/explicacoes'),
  },
};

export default function ExplicacoesPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#f5f5f5]">
        <div className="relative overflow-hidden border-b border-black/15 bg-white px-4 pb-12 pt-32">
          <MathRain speed="fast" />
          <div className="relative z-10 max-w-6xl mx-auto text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#f59e0b]/40 bg-[#fff7ed] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#b45309] mb-4">
              Vagas limitadas · o Exame está a chegar
            </span>
            <h1 className="text-4xl sm:text-5xl font-black text-[#000000] mb-3">
              Explicações de Matemática
            </h1>
            <p className="text-gray-700 max-w-2xl mx-auto text-base sm:text-lg">
              Aulas <strong className="text-[#000000]">online</strong> de Matemática{' '}
              <strong className="text-[#000000]">a partir de 6€/hora</strong>, individuais ou em grupo.
              Diz-me em que precisas e trato de tudo contigo: explicador, horário e plano à tua medida.
            </p>
            <p className="text-gray-500 max-w-2xl mx-auto mt-3 text-sm">
              Comigo ou com a minha equipa de explicadores, escolhidos por mim. Não precisas de marcar
              nem pagar nada já: só me dizes onde precisas de ajuda.
            </p>
          </div>
        </div>

        <LeadSection />
      </main>
      <Footer />
    </>
  );
}
