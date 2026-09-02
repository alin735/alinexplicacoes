import type { Metadata } from 'next';
import { headers } from 'next/headers';
import './globals.css';
import FormValidationPt from '@/components/FormValidationPt';
import ChatWidget from '@/components/ChatWidget';
import WhatsAppButton from '@/components/WhatsAppButton';
import {
  absoluteUrl,
  SITE_DESCRIPTION,
  SITE_LOCALE,
  SITE_NAME,
  SITE_TITLE,
  SITE_URL,
  SOCIAL_URLS,
} from '@/lib/site';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  title: {
    default: SITE_TITLE,
    template: '%s | MatemáticaTop',
  },
  description: SITE_DESCRIPTION,
  // Sem canonical aqui: no App Router as páginas herdam os campos que não
  // definem, e um canonical fixo faria todas as páginas apontar para a
  // homepage (o Google trataria-as como duplicados). Cada página declara o seu.
  icons: {
    icon: ['/favicon.ico', '/favicon.png'],
    apple: '/favicon.png',
    shortcut: '/favicon.ico',
  },
  manifest: '/manifest.webmanifest',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: SITE_LOCALE,
    url: absoluteUrl('/'),
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
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
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ['/logo.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // No portal do aluno (subdomínio aluno.*) não mostramos os widgets do site
  // principal (chat de vendas, WhatsApp) — é uma área privada e focada.
  const host = (headers().get('host') || '').toLowerCase();
  const isPortal = host.startsWith('aluno.');
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': absoluteUrl('/#organization'),
        name: SITE_NAME,
        url: SITE_URL,
        logo: absoluteUrl('/logo.png'),
        description: SITE_DESCRIPTION,
        sameAs: SOCIAL_URLS,
      },
      {
        '@type': 'WebSite',
        '@id': absoluteUrl('/#website'),
        url: SITE_URL,
        name: SITE_NAME,
        inLanguage: 'pt-PT',
        publisher: {
          '@id': absoluteUrl('/#organization'),
        },
      },
    ],
  };

  return (
    <html lang="pt">
      <body className="bg-[#f5f5f5] text-[#111111] min-h-screen font-poppins">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <FormValidationPt />
        {children}
        {!isPortal && <ChatWidget />}
        {!isPortal && <WhatsAppButton />}
      </body>
    </html>
  );
}
