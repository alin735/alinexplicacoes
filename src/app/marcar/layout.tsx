import type { Metadata } from 'next';
import { absoluteUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Explicações de Matemática Online e Aulas de Grupo | MatemáticaTop',
  description:
    'Marca explicações de Matemática online (individuais) ou entra na lista de espera das aulas de grupo. Apoio focado no exame e na melhoria de notas.',
  alternates: {
    canonical: absoluteUrl('/marcar'),
  },
  openGraph: {
    title: 'Explicações de Matemática Online e Aulas de Grupo | MatemáticaTop',
    description:
      'Marca explicações de Matemática online (individuais) ou entra na lista de espera das aulas de grupo. Apoio focado no exame e na melhoria de notas.',
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
