import type { Metadata } from 'next';
import Link from 'next/link';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import { PageHero } from '@/components/ui';
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
        <PageHero
          titulo="Resolução de exercícios de exame"
          descricao="Encontra exercícios resolvidos por ano e por tema."
          largura="total"
        />

        <section className="px-4 pt-8">
          <div className="max-w-6xl mx-auto rounded-2xl border border-black/15 bg-white p-6 shadow-sm">
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
                href="/explicacoes"
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
