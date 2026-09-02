import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { HighlightCard, PageHero, Section } from '@/components/ui';
import { absoluteUrl } from '@/lib/site';

const PATH = '/correcoes';
const TITLE = 'Correções de Exames e Provas de Matemática | MatemáticaTop';
const DESCRIPTION =
  'Todas as correções de Matemática do 9.º ano reconstruídas pela comunidade MatemáticaTop: Exame Nacional 2026 e prova de ensaio, com enunciado e resolução completa.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: absoluteUrl(PATH) },
  keywords: [
    'correções matemática 9 ano',
    'correção exame nacional matemática 9 ano 2026',
    'correção prova ensaio matemática 9 ano',
    'resolução exame matemática 9 ano',
  ],
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: absoluteUrl(PATH),
    type: 'website',
    locale: 'pt_PT',
  },
};

type CorrecaoCard = {
  href: string;
  badge: string;
  title: string;
  description: string;
  cta: string;
};

const CARDS: CorrecaoCard[] = [
  {
    href: '/correcao-prova-matematica-9-ano-2026',
    badge: 'Exame Nacional · 22 jun 2026',
    title: 'Correção do Exame Nacional de Matemática do 9.º ano',
    description:
      'Desde 2025, com a passagem para o formato digital, o IAVE deixou de disponibilizar o enunciado do Exame Nacional do 9.º ano. Reconstruímos a prova de 22 de junho de 2026 com a comunidade: tens a correção em vídeo, questão a questão, para confirmares as tuas respostas.',
    cta: 'Ver correção do Exame Nacional',
  },
  {
    href: '/correcao-prova-ensaio-matematica-9-ano-2026',
    badge: 'Prova de ensaio · 23 abr 2026',
    title: 'Correção da prova de ensaio do 9.º ano',
    description:
      'Realizada a 23 de abril, a prova de ensaio serve para preparar os alunos para o Exame Nacional e testar o novo formato digital. Tal como o exame, não foi disponibilizada ao público, por isso reconstruímo-la com a comunidade. Correção disponível em vídeo, questão a questão.',
    cta: 'Ver correção da prova de ensaio',
  },
];

export default function CorrecoesPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#f5f5f5]">
        <PageHero
          pilula="Correções da comunidade"
          titulo="Correções de Matemática do 9.º ano"
          descricao={
            <>
              Enunciados e <strong className="text-[#000000]">resoluções completas</strong> das provas
              que o IAVE não disponibiliza, reconstruídas pela nossa comunidade.
            </>
          }
        />

        <Section largura="media">
          <div className="grid gap-5 sm:grid-cols-2">
            {CARDS.map((card) => (
              <HighlightCard
                key={card.href}
                href={card.href}
                pilula={card.badge}
                titulo={card.title}
                descricao={card.description}
                chamada={card.cta}
              />
            ))}
          </div>
        </Section>
      </main>
      <Footer />
    </>
  );
}
