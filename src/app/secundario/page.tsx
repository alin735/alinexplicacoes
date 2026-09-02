import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { PageHero, Section } from '@/components/ui';
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
        <PageHero
          pilula="Orientação vocacional · 9.º ano"
          titulo="Que área do secundário é a tua?"
          descricao={
            <>
              Responde a 8 perguntas rápidas e descobre a tua{' '}
              <strong className="text-[#000000]">afinidade com cada área</strong>, com as disciplinas
              e as saídas de cada uma. É uma ferramenta de orientação para te ajudar a refletir.
            </>
          }
        />

        <Section largura="estreita">
          <div className="mx-auto max-w-2xl">
            <Quiz />
          </div>
        </Section>
      </main>
      <Footer />
    </>
  );
}
