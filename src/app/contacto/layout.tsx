import type { Metadata } from 'next';
import { absoluteUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Contacto',
  description:
    'Envia uma mensagem e acompanha a MatemáticaTop nas redes sociais.',
  alternates: {
    canonical: absoluteUrl('/contacto'),
  },
  openGraph: {
    title: 'Contacto | MatemáticaTop',
    description:
      'Envia uma mensagem e acompanha a MatemáticaTop nas redes sociais.',
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
