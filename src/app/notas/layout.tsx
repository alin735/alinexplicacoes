import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Notas',
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
