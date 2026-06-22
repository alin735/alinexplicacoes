import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MathRain from '@/components/MathRain';
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
      'Desde 2025, com a passagem para o formato digital, o IAVE deixou de disponibilizar o enunciado do Exame Nacional do 9.º ano. Reconstruímos a prova de 22 de junho de 2026 com a comunidade: tens o enunciado em PDF e a correção em vídeo, questão a questão, para confirmares as tuas respostas.',
    cta: 'Ver correção do Exame Nacional →',
  },
  {
    href: '/blog/correcao-da-prova-ensaio-9ano',
    badge: 'Prova de ensaio · 23 abr 2026',
    title: 'Correção da prova de ensaio do 9.º ano',
    description:
      'Realizada a 23 de abril, a prova de ensaio serve para preparar os alunos para o Exame Nacional e testar o novo formato digital. Tal como o exame, não foi disponibilizada ao público, por isso reconstruímo-la com a comunidade. Correção disponível em PDF e em vídeo.',
    cta: 'Ver correção da prova de ensaio →',
  },
];

export default function CorrecoesPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-white">
        <section className="relative overflow-hidden border-b border-black/15 bg-white px-4 pb-12 pt-32">
          <MathRain speed="fast" />
          <div className="relative z-10 max-w-3xl mx-auto text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#f59e0b]/40 bg-[#fff7ed] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#b45309] mb-4">
              Correções da comunidade
            </span>
            <h1 className="text-3xl sm:text-5xl font-black text-[#000000] mb-4">Correções de Matemática do 9.º ano</h1>
            <p className="text-gray-700 max-w-2xl mx-auto text-base sm:text-lg">
              Enunciados e <strong className="text-[#000000]">resoluções completas</strong> das provas
              que o IAVE não disponibiliza, reconstruídas pela nossa comunidade.
            </p>
          </div>
        </section>

        <section className="px-4 py-12">
          <div className="max-w-4xl mx-auto grid gap-5 sm:grid-cols-2">
            {CARDS.map((card) => (
              <Link
                key={card.href}
                href={card.href}
                className="group flex flex-col rounded-2xl border border-black/15 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-[#16a34a]/30 bg-[#f0fdf4] px-3 py-1 text-[11px] font-semibold text-[#15803d]">
                  {card.badge}
                </span>
                <h2 className="mt-4 text-xl font-black text-[#000000]">{card.title}</h2>
                <p className="mt-2 flex-1 text-sm text-gray-600">{card.description}</p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-black transition group-hover:gap-2.5">
                  {card.cta}
                </span>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
