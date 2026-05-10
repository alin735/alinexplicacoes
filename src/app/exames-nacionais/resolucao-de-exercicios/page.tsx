import type { Metadata } from 'next';
import Link from 'next/link';
import Footer from '@/components/Footer';
import MathRain from '@/components/MathRain';
import Navbar from '@/components/Navbar';
import ExamExerciseCatalog from '@/components/ExamExerciseCatalog';
import { getPublishedExamExercises } from '@/lib/exam-exercise-posts';
import { absoluteUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Exercícios Resolvidos de Matemática A por Tema e Ano',
  description:
    'Acede a exercícios resolvidos de Matemática A, filtrados por tema e ano, com explicações para treinar para o exame com método.',
  alternates: {
    canonical: absoluteUrl('/exames-nacionais/resolucao-de-exercicios'),
  },
  openGraph: {
    title: 'Exercícios Resolvidos de Matemática A por Tema e Ano | MatemáticaTop',
    description:
      'Acede a exercícios resolvidos de Matemática A, filtrados por tema e ano, com explicações para treinar para o exame com método.',
    url: absoluteUrl('/exames-nacionais/resolucao-de-exercicios'),
  },
};

export default async function ResolucaoDeExerciciosPage() {
  const posts = await getPublishedExamExercises();

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#f5f5f5]">
        <section className="relative bg-white border-b border-black/15 px-4 pb-12 pt-32 overflow-hidden">
          <MathRain speed="fast" />
          <div className="relative z-10 max-w-6xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl font-black text-[#000000] mb-2">
              Resolução de exercícios de exame
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Encontra exercícios resolvidos por ano e por tema.
            </p>
          </div>
        </section>

        <section className="px-4 pt-8">
          <div className="max-w-6xl mx-auto rounded-[2rem] border border-black/10 bg-white p-6 shadow-[0_24px_60px_rgba(0,0,0,0.08)]">
            <h2 className="text-2xl sm:text-3xl font-black text-[#111111] mb-2">
              Recursos que te ajudam no exame
            </h2>
            <p className="text-gray-600 mb-6">
              Complementa os exercícios com análise de frequência dos temas e um plano de estudo.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <Link
                href="/exames-nacionais/o-que-sai"
                className="inline-flex items-center justify-center rounded-xl border border-black/15 px-4 py-3 text-sm font-semibold text-[#111111] transition hover:bg-black hover:text-white"
              >
                Ver frequência dos temas
              </Link>
              <Link
                href="/exames-nacionais/cronogramas"
                className="inline-flex items-center justify-center rounded-xl border border-black/15 px-4 py-3 text-sm font-semibold text-[#111111] transition hover:bg-black hover:text-white"
              >
                Criar plano com cronograma
              </Link>
              <Link
                href="/marcar"
                className="inline-flex items-center justify-center rounded-xl border border-black/15 px-4 py-3 text-sm font-semibold text-[#111111] transition hover:bg-black hover:text-white"
              >
                Marcar explicações
              </Link>
            </div>
          </div>
        </section>

        <section className="px-4 pb-14 pt-8">
          <div className="max-w-6xl mx-auto">
            <ExamExerciseCatalog posts={posts} />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
