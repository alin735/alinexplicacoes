import type { Metadata } from 'next';
import './globals.css';
import FormValidationPt from '@/components/FormValidationPt';
import ChatWidget from '@/components/ChatWidget';

export const metadata: Metadata = {
  metadataBase: new URL('https://matematica.top'),
  title: 'MatemáticaTop',
  description: 'Marca as tuas explicações de Matemática e prepara-te para o Exame Nacional.',
  icons: { icon: '/favicon.png' },
  openGraph: {
    title: 'MatemáticaTop',
    description: 'Marca as tuas explicações de Matemática e prepara-te para o Exame Nacional.',
    images: [
      {
        url: '/logo.png',
        width: 512,
        height: 512,
        alt: 'Logótipo MatemáticaTop',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'MatemáticaTop',
    description: 'Marca as tuas explicações de Matemática e prepara-te para o Exame Nacional.',
    images: ['/logo.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt">
      <body className="bg-[#f5f5f5] text-[#1a1a2e] min-h-screen font-poppins">
        <FormValidationPt />
        {children}
        <ChatWidget />
      </body>
    </html>
  );
}
