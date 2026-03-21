import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServiceSupabase } from '@/lib/server-bookings';

export type AdminAuthResult = {
  adminUserId: string;
};

export async function requireAdminFromRequest(req: NextRequest): Promise<AdminAuthResult> {
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
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data: authData, error: authError } = await userClient.auth.getUser();
  if (authError || !authData.user) {
    throw new Error('Sessão inválida.');
  }

  const service = getServiceSupabase();
  const { data: profile, error: profileError } = await service
    .from('profiles')
    .select('is_admin')
    .eq('id', authData.user.id)
    .single();

  if (profileError || !profile?.is_admin) {
    throw new Error('Acesso reservado a administradores.');
  }

  return { adminUserId: authData.user.id };
}
