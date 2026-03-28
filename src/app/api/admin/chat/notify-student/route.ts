import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/server-bookings';
import { requireAdminFromRequest } from '@/lib/server-admin-auth';
import { chatReplyNotificationEmailTemplate, sendEmail } from '@/lib/email';

type NotifyStudentBody = {
  studentId?: string;
  messageText?: string;
};

export async function POST(req: NextRequest) {
  try {
    await requireAdminFromRequest(req);
    const body = (await req.json()) as NotifyStudentBody;
    const studentId = body.studentId?.trim();
    const messageText = body.messageText?.trim();

    if (!studentId || !messageText) {
      return NextResponse.json({ error: 'studentId e messageText são obrigatórios.' }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, username')
      .eq('id', studentId)
      .single();

    if (profileError) {
      return NextResponse.json({ error: 'Não foi possível carregar o aluno.' }, { status: 500 });
    }

    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(studentId);
    if (userError) {
      return NextResponse.json({ error: 'Não foi possível carregar o email do aluno.' }, { status: 500 });
    }

    const studentEmail = userData.user?.email;
    if (!studentEmail) {
      return NextResponse.json({ error: 'O aluno não tem um email disponível.' }, { status: 404 });
    }

    const studentName = profile?.full_name || profile?.username || 'Aluno';
    const html = chatReplyNotificationEmailTemplate(studentName, messageText);
    await sendEmail(studentEmail, 'Nova mensagem do Alin no chat', html);

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao enviar notificação de chat.';
    const status = message.includes('Sem autenticação válida.')
      ? 401
      : message.includes('administradores') || message.includes('Sessão inválida')
        ? 403
        : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
