import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isStudentFirstLesson } from '@/lib/server-bookings';

function getUserClient(authHeader: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error('Configuração Supabase incompleta no servidor.');
  }

  return createClient(url, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Sem autenticação válida.' }, { status: 401 });
    }

    const userClient = getUserClient(authHeader);
    const { data: authData, error: authError } = await userClient.auth.getUser();
    if (authError || !authData.user) {
      return NextResponse.json({ error: 'Sessão inválida.' }, { status: 401 });
    }

    const isFirstLesson = await isStudentFirstLesson(authData.user.id);
    return NextResponse.json({ isFirstLesson });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Erro ao verificar a primeira aula.' },
      { status: 500 },
    );
  }
}
