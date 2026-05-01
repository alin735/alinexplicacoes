import type { Metadata } from 'next';
import { absoluteUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Explicações',
  description:
    'Escolhe entre explicações individuais e aulas de grupo de Matemática.',
  alternates: {
    canonical: absoluteUrl('/marcar'),
  },
  openGraph: {
    title: 'Explicações | MatemáticaTop',
    description:
      'Escolhe entre explicações individuais e aulas de grupo de Matemática.',
    url: absoluteUrl('/marcar'),
  },
};

export default function MarcarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
