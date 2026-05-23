import type { Metadata } from 'next';
import { absoluteUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Preparação Intensiva Exame Nacional de Matemática do 9.º Ano | MatemáticaTop',
  description:
    '15 aulas ao vivo no Discord, gravações e materiais por tema. Preparação intensiva para o Exame Nacional de Matemática do 9.º ano 2026, com quem tirou 100% nesse exame.',
  keywords: [
    'preparação exame matemática 9 ano',
    'exame nacional matemática 9 ano',
    'preparação intensiva matemática',
    'preparação exame matemática 2026',
    'aulas matemática 9 ano',
    'revisões matemática 9 ano',
    'exame nacional 2026',
  ],
  alternates: { canonical: absoluteUrl('/preparacao') },
  openGraph: {
    title: 'Preparação Intensiva Exame de Matemática 9.º Ano | MatemáticaTop',
    description:
      '15 aulas ao vivo no Discord, gravações e materiais por tema. Preparação intensiva para o Exame Nacional de Matemática do 9.º ano 2026, com quem tirou 100% nesse exame.',
    url: absoluteUrl('/preparacao'),
    type: 'website',
  },
};

export default function PreparacaoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
