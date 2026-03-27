export const BRAND_ICON_MAP: Record<string, string> = {
  // Social
  tiktok: '/brand-emojis/social-tiktok.png',
  youtube: '/brand-emojis/social-youtube.png',
  discord: '/brand-emojis/social-discord.png',

  // Feedback / states
  '✅': '/brand-emojis/token-check.png',
  '✕': '/brand-emojis/token-cross.png',
  '❌': '/brand-emojis/token-cross.png',
  '🎉': '/brand-emojis/token-party.png',
  '🚀': '/brand-emojis/token-foguete.png',

  // People / pricing
  '🎓': '/brand-emojis/token-ano.png',
  '👤': '/brand-emojis/token-pessoa.png',
  '👥': '/brand-emojis/token-grupo.png',
  '💰': '/brand-emojis/token-dinheiro.png',
  '💳': '/brand-emojis/token-cartao.png',

  // Calendar / docs / planning
  '📅': '/brand-emojis/token-calendario.png',
  '📆': '/brand-emojis/token-calendario.png',
  '📊': '/brand-emojis/token-grafico.png',
  '📋': '/brand-emojis/token-clipboard.png',
  '📌': '/brand-emojis/token-pin.png',
  '📎': '/brand-emojis/token-paperclip.png',
  '📝': '/brand-emojis/token-notas.png',
  '📣': '/brand-emojis/token-megafone.png',
  '🔗': '/brand-emojis/token-link.png',
  '🕐': '/brand-emojis/token-relogio.png',
  '⏳': '/brand-emojis/token-ampulheta.png',
  '⏰': '/brand-emojis/token-relogio.png',

  // Study / subjects
  '📐': '/brand-emojis/token-regua.png',
  '📖': '/brand-emojis/token-disciplinas.png',
  '📚': '/brand-emojis/token-disciplinas.png',
  '⚗️': '/brand-emojis/token-fisico-quimica.png',
  '🌿': '/brand-emojis/token-cerebro.png',
  '🧠': '/brand-emojis/token-cerebro.png',
};

const BRAND_EMOJI_TOKENS = [
  '⚗️',
  '✅',
  '✕',
  '❌',
  '🌿',
  '🎉',
  '🎓',
  '👤',
  '👥',
  '💰',
  '💳',
  '📅',
  '📆',
  '📊',
  '📋',
  '📌',
  '📎',
  '📐',
  '📖',
  '📚',
  '📝',
  '📣',
  '🔗',
  '🕐',
  '🚀',
  '🧠',
  '⏳',
  '⏰',
] as const;

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const BRAND_EMOJI_PATTERN = `(${BRAND_EMOJI_TOKENS.map(escapeRegex).join('|')})`;
export const BRAND_EMOJI_REGEX = new RegExp(BRAND_EMOJI_PATTERN);
export const BRAND_EMOJI_REGEX_GLOBAL = new RegExp(BRAND_EMOJI_PATTERN, 'g');

export function getBrandEmojiPath(token: string) {
  return BRAND_ICON_MAP[token] || BRAND_ICON_MAP['📚'];
}

function normalizeBaseUrl(siteUrl?: string) {
  return (siteUrl || process.env.NEXT_PUBLIC_SITE_URL || 'https://matematica.top').replace(/\/+$/, '');
}

export function buildBrandEmojiHtml(token: string, siteUrl?: string, sizePx = 18) {
  const src = `${normalizeBaseUrl(siteUrl)}${getBrandEmojiPath(token)}`;
  return `<img src="${src}" alt="" aria-hidden="true" style="display:inline-block;width:${sizePx}px;height:${sizePx}px;vertical-align:-0.2em;object-fit:contain;margin-right:0.2em;" />`;
}

export function replaceBrandEmojisWithHtml(input: string, siteUrl?: string, sizePx = 18) {
  return input.replace(BRAND_EMOJI_REGEX_GLOBAL, (token) => buildBrandEmojiHtml(token, siteUrl, sizePx));
}

export function stripBrandEmojis(input: string) {
  return input
    .replace(BRAND_EMOJI_REGEX_GLOBAL, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}
