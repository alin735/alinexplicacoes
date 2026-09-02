import type { Metadata } from 'next';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import { PageHero, Section } from '@/components/ui';
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
        <PageHero
          titulo="Cronogramas"
          descricao="Escolhe entre Matemática A e 9.º ano. Depois, seleciona quando vais começar a estudar e o tema em que sentes mais dificuldade."
          largura="total"
        />

        <Section>
          <CronogramaPlanner />
        </Section>
      </main>
      <Footer />
    </>
  );
}
