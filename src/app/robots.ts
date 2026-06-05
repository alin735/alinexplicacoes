import type { MetadataRoute } from 'next';
import { absoluteUrl, SITE_URL } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      // A página de informações é pública e indexável; os links privados de
      // marcação (/marcar?explicador=<token>) não devem ser indexados.
      allow: ['/', '/marcar/informacoes'],
      disallow: ['/admin', '/conta', '/login', '/aulas', '/notas', '/api/', '/marcar'],
    },
    sitemap: absoluteUrl('/sitemap.xml'),
    host: SITE_URL,
  };
}
