import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pagamento Cancelado',
  robots: {
    index: false,
    follow: false,
  },
};

export default function MarcarCanceladoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
