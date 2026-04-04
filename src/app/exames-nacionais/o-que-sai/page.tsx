import Image from 'next/image';
import type { Metadata } from 'next';
import Footer from '@/components/Footer';
import MathRain from '@/components/MathRain';
import Navbar from '@/components/Navbar';
import ExamTopicExplorer from '@/components/ExamTopicExplorer';
import { absoluteUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'O Que Sai Nos Exames',
  description:
    'Consulta em que anos saiu cada tema entre 2016 e 2025.',
  alternates: {
    canonical: absoluteUrl('/exames-nacionais/o-que-sai'),
  },
  openGraph: {
    title: 'O Que Sai Nos Exames | MatemáticaTop',
    description:
      'Consulta em que anos saiu cada tema entre 2016 e 2025.',
    url: absoluteUrl('/exames-nacionais/o-que-sai'),
  },
};

export default function OQueSaiNosExamesPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#f5f5f5]">
        <section className="relative bg-white border-b border-black/15 px-4 pb-12 pt-32 overflow-hidden">
          <MathRain speed="fast" />
          <div className="relative z-10 max-w-6xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl font-black text-[#000000] mb-2">
              O que sai nos exames
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Seleciona um tema para ver em que exames apareceu entre 2016 e 2025.
            </p>
          </div>
        </section>

        <section className="px-4 py-8">
          <div className="max-w-6xl mx-auto rounded-[2rem] border border-black/10 bg-white px-5 py-4 shadow-[0_24px_60px_rgba(0,0,0,0.08)]">
            <p className="flex items-center gap-3 text-base sm:text-lg italic leading-relaxed text-[#111111]">
              <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center">
                <Image src="/images/exames/aviso-triangulo.png" alt="" width={28} height={28} className="object-contain" />
              </span>
              Apesar de alguns temas serem mais frequentes, não deixes de estudar os restantes. Todos os temas podem sair no exame.
            </p>
          </div>
        </section>

        <section className="px-4 pb-16">
          <div className="max-w-6xl mx-auto">
            <ExamTopicExplorer />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
