import type { Metadata } from 'next';
import { absoluteUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: {
    default: 'Exames nacionais',
    template: '%s | MatemáticaTop',
  },
  description:
    'Cronogramas de estudo e frequência dos temas no exame nacional.',
  alternates: {
    canonical: absoluteUrl('/exames-nacionais'),
  },
  openGraph: {
    title: 'Exames nacionais | MatemáticaTop',
    description:
      'Cronogramas de estudo e frequência dos temas no exame nacional.',
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
