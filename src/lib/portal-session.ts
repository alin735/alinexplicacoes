import { cookies } from 'next/headers';
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'crypto';

// Sessão própria do portal (sem Supabase Auth, sem email). O aluno escolhe um
// PIN pessoal na inscrição; a sessão fica guardada no browser por ~180 dias.
const STUDENT_COOKIE = 'portal_student';
const ADMIN_COOKIE = 'portal_admin';
const MAX_AGE = 60 * 60 * 24 * 180; // 180 dias

function secret(): string {
  return (
    process.env.PORTAL_SESSION_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    'dev-insecure-portal-secret'
  );
}

// ─── PIN pessoal (hash com scrypt) ──────────────────────────────────────────
export function hashPin(pin: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(pin, salt, 32).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPin(pin: string, stored: string | null | undefined): boolean {
  if (!stored) return false;
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const test = scryptSync(pin, salt, 32);
  const orig = Buffer.from(hash, 'hex');
  return orig.length === test.length && timingSafeEqual(orig, test);
}

// ─── Assinatura do cookie de sessão ─────────────────────────────────────────
function sign(value: string): string {
  return createHmac('sha256', secret()).update(value).digest('hex');
}

function makeToken(id: string): string {
  return `${id}.${sign(id)}`;
}

function readToken(token: string | undefined): string | null {
  if (!token) return null;
  const idx = token.lastIndexOf('.');
  if (idx < 0) return null;
  const id = token.slice(0, idx);
  const sig = token.slice(idx + 1);
  const expected = sign(id);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return id;
}

const cookieOpts = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: MAX_AGE,
};

// ─── Sessão do aluno ────────────────────────────────────────────────────────
export function setStudentSession(id: string) {
  cookies().set(STUDENT_COOKIE, makeToken(id), cookieOpts);
}

export function getStudentSessionId(): string | null {
  return readToken(cookies().get(STUDENT_COOKIE)?.value);
}

export function clearStudentSession() {
  cookies().set(STUDENT_COOKIE, '', { ...cookieOpts, maxAge: 0 });
}

// ─── Sessão do admin ────────────────────────────────────────────────────────
export function verifyAdminCode(code: string): boolean {
  const expected = process.env.PORTAL_ADMIN_CODE || '';
  if (!expected) return false;
  const a = Buffer.from(code);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function setAdminSession() {
  cookies().set(ADMIN_COOKIE, makeToken('admin'), cookieOpts);
}

export function getAdminSession(): boolean {
  return readToken(cookies().get(ADMIN_COOKIE)?.value) === 'admin';
}

export function clearAdminSession() {
  cookies().set(ADMIN_COOKIE, '', { ...cookieOpts, maxAge: 0 });
}
