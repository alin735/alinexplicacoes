import type { Metadata } from 'next';
import { absoluteUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Contacto',
  description:
    'Fala com a MatemáticaTop sobre explicações de Matemática ou envia uma mensagem. Também estamos no YouTube, TikTok e Discord.',
  alternates: {
    canonical: absoluteUrl('/contacto'),
  },
  openGraph: {
    title: 'Contacto | MatemáticaTop',
    description:
      'Fala com a MatemáticaTop sobre explicações de Matemática ou envia uma mensagem. Também estamos no YouTube, TikTok e Discord.',
    url: absoluteUrl('/contacto'),
  },
};

export default function ContactoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
