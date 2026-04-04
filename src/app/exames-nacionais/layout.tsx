import type { Metadata } from 'next';
import { absoluteUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: {
    default: 'Exames Nacionais',
    template: '%s | MatemáticaTop',
  },
  description:
    'Cronogramas, frequência dos temas e exercícios resolvidos para o Exame Nacional.',
  alternates: {
    canonical: absoluteUrl('/exames-nacionais'),
  },
  openGraph: {
    title: 'Exames Nacionais | MatemáticaTop',
    description:
      'Cronogramas, frequência dos temas e exercícios resolvidos para o Exame Nacional.',
    url: absoluteUrl('/exames-nacionais'),
  },
};

export default function ExamesNacionaisLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
