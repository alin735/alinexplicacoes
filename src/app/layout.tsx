import type { Metadata } from 'next';
import './globals.css';
import FormValidationPt from '@/components/FormValidationPt';
import ChatWidget from '@/components/ChatWidget';
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
  alternates: {
    canonical: absoluteUrl('/'),
  },
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
      <body className="bg-[#f5f5f5] text-[#1a1a2e] min-h-screen font-poppins">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <FormValidationPt />
        {children}
        <ChatWidget />
      </body>
    </html>
  );
}
