import type { Metadata } from 'next';
import { absoluteUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Explicações',
  description:
    'Agenda uma aula de Matemática online e escolhe o tema, a data e a hora.',
  alternates: {
    canonical: absoluteUrl('/marcar'),
  },
  openGraph: {
    title: 'Explicações | MatemáticaTop',
    description:
      'Agenda uma aula de Matemática online e escolhe o tema, a data e a hora.',
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
