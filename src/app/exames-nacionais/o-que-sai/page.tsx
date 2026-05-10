import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import Footer from '@/components/Footer';
import MathRain from '@/components/MathRain';
import Navbar from '@/components/Navbar';
import ExamTopicExplorer from '@/components/ExamTopicExplorer';
import { absoluteUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'O que sai no Exame de Matemática A (2016-2025)',
  description:
    'Vê em que anos e fases saiu cada tema de Matemática A (2016-2025) e descobre os conteúdos com maior frequência no exame.',
  alternates: {
    canonical: absoluteUrl('/exames-nacionais/o-que-sai'),
  },
  openGraph: {
    title: 'O que sai no Exame de Matemática A (2016-2025) | MatemáticaTop',
    description:
      'Vê em que anos e fases saiu cada tema de Matemática A (2016-2025) e descobre os conteúdos com maior frequência no exame.',
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
              Em função do tema escolhido, são apresentados os exames em que essa matéria esteve incluída, de 2016 a 2025.
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

        <section className="px-4 pb-16">
          <div className="max-w-6xl mx-auto rounded-[2rem] border border-black/10 bg-white p-6 shadow-[0_24px_60px_rgba(0,0,0,0.08)]">
            <h2 className="text-2xl sm:text-3xl font-black text-[#111111] mb-2">
              Próximo passo
            </h2>
            <p className="text-gray-600 mb-6">
              Depois de veres os temas mais frequentes, passa à prática com recursos diretos para o exame.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <Link
                href="/exames-nacionais/resolucao-de-exercicios"
                className="inline-flex items-center justify-center rounded-xl border border-black/15 px-4 py-3 text-sm font-semibold text-[#111111] transition hover:bg-black hover:text-white"
              >
                Praticar exercícios resolvidos
              </Link>
              <Link
                href="/exames-nacionais/cronogramas"
                className="inline-flex items-center justify-center rounded-xl border border-black/15 px-4 py-3 text-sm font-semibold text-[#111111] transition hover:bg-black hover:text-white"
              >
                Montar cronograma de estudo
              </Link>
              <Link
                href="/marcar"
                className="inline-flex items-center justify-center rounded-xl border border-black/15 px-4 py-3 text-sm font-semibold text-[#111111] transition hover:bg-black hover:text-white"
              >
                Marcar explicação
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
