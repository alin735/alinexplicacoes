import type { Metadata } from 'next';
import { absoluteUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Informações Sobre Marcações',
  description:
    'Tudo o que precisas saber sobre as marcações e o funcionamento das aulas.',
  alternates: {
    canonical: absoluteUrl('/marcar/informacoes'),
  },
};

export default function MarcarInformacoesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
