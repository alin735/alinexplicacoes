import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Marcação Concluída',
  robots: {
    index: false,
    follow: false,
  },
};

export default function MarcarSucessoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
