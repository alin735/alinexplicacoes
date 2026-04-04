import type { Metadata } from 'next';
import { absoluteUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Cronograma de Estudo',
  description:
    'Cria um cronograma de estudo para Matemática A e organiza a tua preparação para o Exame Nacional com um plano estruturado.',
  alternates: {
    canonical: absoluteUrl('/exames-nacionais/cronogramas'),
  },
  openGraph: {
    title: 'Cronograma de Estudo | MatemáticaTop',
    description:
      'Cria um cronograma de estudo para Matemática A e organiza a tua preparação para o Exame Nacional com um plano estruturado.',
    url: absoluteUrl('/exames-nacionais/cronogramas'),
  },
};

export default function CronogramaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
