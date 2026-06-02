import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getTutorById, type Tutor } from '@/lib/tutors';

export type TutorAuthResult = {
  tutor: Tutor;
  userId: string;
};

/**
 * Garante que o pedido vem de um explicador autenticado (Alin ou Luís).
 * Lança erro se não houver sessão válida ou se o utilizador não for explicador.
 */
export async function requireTutorFromRequest(req: NextRequest): Promise<TutorAuthResult> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Sem autenticação válida.');
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error('Configuração Supabase incompleta no servidor.');
  }

  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  const userClient = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: authData, error: authError } = await userClient.auth.getUser();
  if (authError || !authData.user) {
    throw new Error('Sessão inválida.');
  }

  const tutor = getTutorById(authData.user.id);
  if (!tutor) {
    throw new Error('Acesso reservado a explicadores.');
  }

  return { tutor, userId: authData.user.id };
}

/**
 * Converte um erro lançado por `requireTutorFromRequest` no código HTTP certo.
 * 401 quando não há sessão/token; 403 quando o utilizador não é explicador.
 */
export function tutorAuthErrorStatus(message: string): number {
  if (message.includes('Sem autenticação válida.') || message.includes('Sessão inválida.')) {
    return 401;
  }
  if (message.includes('Acesso reservado a explicadores.')) {
    return 403;
  }
  return 500;
}
