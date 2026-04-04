import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Minhas Aulas',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AulasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
