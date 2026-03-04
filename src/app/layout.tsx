import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AlinMat — Explicações',
  description: 'Marca as tuas explicações de Matemática, Físico-Química, Biologia-Geologia e Português.',
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
        {children}
      </body>
    </html>
  );
}
