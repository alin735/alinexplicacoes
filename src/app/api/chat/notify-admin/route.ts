import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServiceSupabase } from '@/lib/server-bookings';
import {
  ADMIN_EMAIL,
  adminChatMessageNotificationEmailTemplate,
  sendEmail,
} from '@/lib/email';

type NotifyAdminBody = {
  messageText?: string;
};

function getUserClient(authHeader: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error('Configuração Supabase incompleta no servidor.');
  }

  return createClient(url, anonKey, {
    global: {
      headers: {
        Authorization: authHeader,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Sem autenticação válida.' }, { status: 401 });
    }

    const body = (await req.json()) as NotifyAdminBody;
    const messageText = body.messageText?.trim();
    if (!messageText) {
      return NextResponse.json({ error: 'messageText é obrigatório.' }, { status: 400 });
    }

    const userClient = getUserClient(authHeader);
    const { data: authData, error: authError } = await userClient.auth.getUser();
    if (authError || !authData.user) {
      return NextResponse.json({ error: 'Sessão inválida.' }, { status: 401 });
    }

    const service = getServiceSupabase();
    const { data: profile } = await service
      .from('profiles')
      .select('full_name, username')
      .eq('id', authData.user.id)
      .maybeSingle();

    const studentEmail = authData.user.email?.trim() || 'Sem email disponível';
    const studentName = profile?.full_name || profile?.username || studentEmail || 'Aluno';
    const html = adminChatMessageNotificationEmailTemplate(studentName, studentEmail, messageText);

    await sendEmail(ADMIN_EMAIL, `Nova mensagem no chat — ${studentName}`, html);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao enviar notificação de chat.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
