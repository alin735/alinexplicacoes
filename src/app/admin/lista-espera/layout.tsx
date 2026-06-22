import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Lista de espera',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminWaitlistLayout({ children }: { children: React.ReactNode }) {
  return children;
}
