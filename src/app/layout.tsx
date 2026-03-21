import type { Metadata } from 'next';
import './globals.css';
import FormValidationPt from '@/components/FormValidationPt';

export const metadata: Metadata = {
  title: 'Matemática é Top',
  description: 'Marca as tuas explicações de Matemática e prepara-te para o Exame Nacional.',
  icons: { icon: '/favicon.png' },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt">
      <body className="bg-[#f0f4f8] text-[#1a1a2e] min-h-screen font-poppins">
        <FormValidationPt />
        {children}
      </body>
    </html>
  );
}
