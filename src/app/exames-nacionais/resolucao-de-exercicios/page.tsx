import type { Metadata } from 'next';
import Footer from '@/components/Footer';
import MathRain from '@/components/MathRain';
import Navbar from '@/components/Navbar';
import ExamExerciseCatalog from '@/components/ExamExerciseCatalog';
import { getPublishedExamExercises } from '@/lib/exam-exercise-posts';
import { absoluteUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Resolução de Exercícios de Exame',
  description:
    'Exercícios resolvidos por ano e por tema.',
  alternates: {
    canonical: absoluteUrl('/exames-nacionais/resolucao-de-exercicios'),
  },
  openGraph: {
    title: 'Resolução de Exercícios de Exame | MatemáticaTop',
    description:
      'Exercícios resolvidos por ano e por tema.',
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

        <section className="px-4 py-14">
          <div className="max-w-6xl mx-auto">
            <ExamExerciseCatalog posts={posts} />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
