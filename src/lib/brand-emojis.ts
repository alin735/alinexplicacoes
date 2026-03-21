const BRAND_ICON_PATHS = Array.from(
  { length: 23 },
  (_, index) => `/brand-emojis/emoji-${String(index + 1).padStart(2, '0')}.png`,
);

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

export const BRAND_EMOJI_MAP: Record<string, string> = Object.fromEntries(
  BRAND_EMOJI_TOKENS.map((token, index) => [token, BRAND_ICON_PATHS[index % BRAND_ICON_PATHS.length]]),
);

export const BRAND_EMOJI_PATTERN = `(${BRAND_EMOJI_TOKENS.map(escapeRegex).join('|')})`;
export const BRAND_EMOJI_REGEX = new RegExp(BRAND_EMOJI_PATTERN);
export const BRAND_EMOJI_REGEX_GLOBAL = new RegExp(BRAND_EMOJI_PATTERN, 'g');

export function getBrandEmojiPath(token: string) {
  return BRAND_EMOJI_MAP[token] || BRAND_ICON_PATHS[0];
}

function normalizeBaseUrl(siteUrl?: string) {
  return (siteUrl || process.env.NEXT_PUBLIC_SITE_URL || 'https://matematica.top').replace(/\/+$/, '');
}

export function buildBrandEmojiHtml(token: string, siteUrl?: string, sizePx = 16) {
  const src = `${normalizeBaseUrl(siteUrl)}${getBrandEmojiPath(token)}`;
  return `<img src="${src}" alt="" aria-hidden="true" style="display:inline-block;width:${sizePx}px;height:${sizePx}px;vertical-align:-0.2em;object-fit:contain;margin-right:0.2em;" />`;
}

export function replaceBrandEmojisWithHtml(input: string, siteUrl?: string, sizePx = 16) {
  return input.replace(BRAND_EMOJI_REGEX_GLOBAL, (token) => buildBrandEmojiHtml(token, siteUrl, sizePx));
}

export function stripBrandEmojis(input: string) {
  return input
    .replace(BRAND_EMOJI_REGEX_GLOBAL, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

