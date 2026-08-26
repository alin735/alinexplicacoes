import crypto from 'crypto';

export type EmailAudience =
  | 'newsletter'
  | 'exam-waitlist'
  | 'matematica-a-waitlist'
  | 'group-classes-waitlist';

export const EMAIL_AUDIENCES: EmailAudience[] = [
  'newsletter',
  'exam-waitlist',
  'matematica-a-waitlist',
  'group-classes-waitlist',
];

/** Como cada audiência se descreve a si própria no rodapé do email. */
export const AUDIENCE_DESCRIPTION: Record<EmailAudience, string> = {
  newsletter: 'Recebes este email porque subscreveste a newsletter da MatemáticaTop.',
  'exam-waitlist':
    'Recebes este email porque entraste na lista de espera das Explicações Top em matematica.top.',
  'matematica-a-waitlist':
    'Recebes este email porque entraste na lista de espera das Explicações de Matemática A em matematica.top.',
  'group-classes-waitlist':
    'Recebes este email porque entraste na lista de espera das aulas de grupo em matematica.top.',
};

export function isEmailAudience(value: unknown): value is EmailAudience {
  return typeof value === 'string' && (EMAIL_AUDIENCES as string[]).includes(value);
}

export function getSiteUrl() {
  const raw = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://matematica.top';
  return raw.replace(/\/+$/, '');
}

function getSecret() {
  const secret = process.env.UNSUBSCRIBE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) {
    throw new Error('Falta UNSUBSCRIBE_SECRET (ou SUPABASE_SERVICE_ROLE_KEY) no servidor.');
  }
  return secret;
}

function toBase64Url(value: string) {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function fromBase64Url(value: string) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function signPayload(payload: string) {
  return crypto.createHmac('sha256', getSecret()).update(payload).digest('base64url').slice(0, 32);
}

/**
 * Token auto-contido: não precisa de nada guardado na base de dados para o
 * link funcionar, e sem o segredo ninguém consegue agir em nome de outra
 * pessoa. O propósito vai dentro da assinatura, por isso um link de cancelar
 * subscrição não serve como link do inquérito nem ao contrário.
 */
function createSignedToken(purpose: string, value: string) {
  const payload = toBase64Url(`${purpose}:${value}`);
  return `${payload}.${signPayload(payload)}`;
}

function readSignedToken(purpose: string, token: string): string | null {
  const [payload, signature] = String(token || '').split('.');
  if (!payload || !signature) return null;

  const expected = signPayload(payload);
  const given = Buffer.from(signature);
  const wanted = Buffer.from(expected);
  if (given.length !== wanted.length || !crypto.timingSafeEqual(given, wanted)) {
    return null;
  }

  let decoded = '';
  try {
    decoded = fromBase64Url(payload);
  } catch {
    return null;
  }

  const prefix = `${purpose}:`;
  if (!decoded.startsWith(prefix)) return null;
  return decoded.slice(prefix.length);
}

export function createUnsubscribeToken(email: string, audience: EmailAudience) {
  return createSignedToken('unsub', `${audience}:${email.trim().toLowerCase()}`);
}

export function parseUnsubscribeToken(
  token: string,
): { email: string; audience: EmailAudience } | null {
  const value = readSignedToken('unsub', token);
  if (!value) return null;

  const separator = value.indexOf(':');
  if (separator === -1) return null;

  const audience = value.slice(0, separator);
  const email = value.slice(separator + 1).trim().toLowerCase();
  if (!isEmailAudience(audience) || !email.includes('@')) return null;

  return { email, audience };
}

/** Identifica quem abriu o inquérito das disciplinas, sem pedir login. */
export function createSurveyToken(email: string) {
  return createSignedToken('subjects', email.trim().toLowerCase());
}

export function parseSurveyToken(token: string): string | null {
  const email = readSignedToken('subjects', token);
  if (!email || !email.includes('@')) return null;
  return email.trim().toLowerCase();
}

export function buildSurveyUrl(email: string) {
  return `${getSiteUrl()}/explicacoes-top/disciplinas?t=${encodeURIComponent(
    createSurveyToken(email),
  )}`;
}

export function buildUnsubscribeUrl(email: string, audience: EmailAudience) {
  return `${getSiteUrl()}/api/unsubscribe?token=${encodeURIComponent(
    createUnsubscribeToken(email, audience),
  )}`;
}

/**
 * Cabeçalhos que o Gmail e o Outlook usam para mostrar o botão nativo de
 * cancelar subscrição. Sem isto, quem quer sair carrega em "spam".
 */
export function buildUnsubscribeHeaders(email: string, audience: EmailAudience) {
  return {
    'List-Unsubscribe': `<${buildUnsubscribeUrl(email, audience)}>`,
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
  };
}

function renderUnsubscribeFooter(email: string, audience: EmailAudience) {
  const url = buildUnsubscribeUrl(email, audience);
  return `
    <div style="margin:28px auto 0;max-width:520px;padding:16px 8px 0;border-top:1px solid #e7eaee;text-align:center;font-family:Arial,sans-serif;">
      <p style="margin:0 0 6px;color:#8a8f98;font-size:12px;line-height:1.6;">
        ${AUDIENCE_DESCRIPTION[audience]}
      </p>
      <p style="margin:0;color:#8a8f98;font-size:12px;line-height:1.6;">
        <a href="${url}" style="color:#8a8f98;text-decoration:underline;">Cancelar subscrição</a>
      </p>
    </div>
  `;
}

/** Junta o rodapé ao conteúdo, dentro do body quando o HTML é um documento completo. */
export function withUnsubscribeFooter(html: string, email: string, audience: EmailAudience) {
  const footer = renderUnsubscribeFooter(email, audience);
  const bodyClose = html.toLowerCase().lastIndexOf('</body>');
  if (bodyClose === -1) return `${html}${footer}`;
  return `${html.slice(0, bodyClose)}${footer}${html.slice(bodyClose)}`;
}
