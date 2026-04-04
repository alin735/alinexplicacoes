import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    {
      url: absoluteUrl('/'),
      lastModified,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: absoluteUrl('/marcar'),
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.95,
    },
    {
      url: absoluteUrl('/exames-nacionais'),
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: absoluteUrl('/exames-nacionais/cronogramas'),
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.88,
    },
    {
      url: absoluteUrl('/exames-nacionais/o-que-sai'),
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.87,
    },
    {
      url: absoluteUrl('/exames-nacionais/resolucao-de-exercicios'),
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.86,
    },
    {
      url: absoluteUrl('/contacto'),
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.65,
    },
    {
      url: absoluteUrl('/marcar/informacoes'),
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.55,
    },
    {
      url: absoluteUrl('/termos-de-utilizador'),
      lastModified,
      changeFrequency: 'yearly',
      priority: 0.2,
    },
  ];
}
