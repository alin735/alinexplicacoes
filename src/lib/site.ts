export const SITE_URL = 'https://matematica.top';
export const SITE_NAME = 'MatemáticaTop';
export const SITE_TITLE = 'Explicações e vídeos de Matemática do 7.º ao 12.º ano | MatemáticaTop';
export const SITE_DESCRIPTION =
  'Explicações de Matemática online e aulas em vídeo do 7.º ao 12.º ano, organizadas por ano e por tema, com os exames nacionais resolvidos.';
export const SITE_LOCALE = 'pt_PT';

export const SOCIAL_URLS = [
  'https://www.youtube.com/@matematicatop1',
  'https://www.tiktok.com/@matematicatop1',
  'https://discord.gg/matematicatop',
];

// ─── WhatsApp Business ────────────────────────────────────────────────────────
// Número no formato internacional (Portugal, +351), sem espaços nem símbolos,
// como exigido pelos links wa.me.
export const WHATSAPP_NUMBER = '351924689159';
/** Número formatado para mostrar ao utilizador. */
export const WHATSAPP_DISPLAY = '+351 924 689 159';
/** Mensagem pré-preenchida quando o utilizador abre a conversa pelo site. */
export const WHATSAPP_DEFAULT_MESSAGE =
  'Olá! Vim pelo site da MatemáticaTop e queria saber mais sobre as explicações de Matemática.';

/** Constrói o link wa.me com uma mensagem opcional pré-preenchida. */
export function whatsappLink(message: string = WHATSAPP_DEFAULT_MESSAGE) {
  const base = `https://wa.me/${WHATSAPP_NUMBER}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export function absoluteUrl(path = '/') {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_URL}${normalizedPath}`;
}
