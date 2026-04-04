export const SITE_URL = 'https://matematica.top';
export const SITE_NAME = 'MatemáticaTop';
export const SITE_TITLE = 'Explicações de Matemática Online em Portugal | MatemáticaTop';
export const SITE_DESCRIPTION =
  'Explicações de Matemática online com aulas, cronogramas e recursos de apoio para o secundário.';
export const SITE_LOCALE = 'pt_PT';

export const SOCIAL_URLS = [
  'https://www.tiktok.com/@matematicatop1?is_from_webapp=1&sender_device=pc',
  'https://youtube.com/@matematicatop1?si=dH9qdhF7ur3Y9EhR',
  'https://discord.gg/7eK2QAsp23',
];

export function absoluteUrl(path = '/') {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_URL}${normalizedPath}`;
}
