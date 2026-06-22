import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/server-bookings';
import { requireAdminFromRequest } from '@/lib/server-admin-auth';
import { sendEmail } from '@/lib/email';

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function messageEmailHtml(name: string, message: string) {
  const safeMessage = escapeHtml(message).replace(/\n/g, '<br />');
  return `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111111;">
      <p>Olá, <strong>${escapeHtml(name)}</strong>!</p>
      <div style="margin:16px 0;">${safeMessage}</div>
      <p style="margin-top:24px;color:#6b7280;font-size:13px;">
        Alin · MatemáticaTop · matematica.top
      </p>
    </div>
  `;
}

function errorStatus(message: string) {
  if (message.includes('Sem autenticação válida.')) return 401;
  if (message.includes('administradores') || message.includes('Sessão inválida')) return 403;
  return 500;
}

export async function POST(req: NextRequest) {
  try {
    await requireAdminFromRequest(req);
    const body = (await req.json().catch(() => ({}))) as {
      id?: string;
      subject?: string;
      message?: string;
    };

    const id = typeof body.id === 'string' ? body.id.trim() : '';
    const subject = typeof body.subject === 'string' && body.subject.trim() ? body.subject.trim() : null;
    const message = typeof body.message === 'string' ? body.message.trim() : '';

    if (!id || !message) {
      return NextResponse.json({ error: 'Falta o aluno ou a mensagem.' }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    const { data: lead, error: leadError } = await supabase
      .from('exam_correction_waitlist')
      .select('full_name, email')
      .eq('id', id)
      .maybeSingle();

    if (leadError || !lead?.email) {
      return NextResponse.json({ error: 'Aluno não encontrado.' }, { status: 404 });
    }

    const name = lead.full_name || lead.email;
    await sendEmail(
      lead.email,
      subject || 'Explicações Top — MatemáticaTop',
      messageEmailHtml(name, message),
    );

    // Marca como contactado após o envio com sucesso.
    await supabase.from('exam_correction_waitlist').update({ status: 'contacted' }).eq('id', id);

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao enviar a mensagem.';
    return NextResponse.json({ error: message }, { status: errorStatus(message) });
  }
}
