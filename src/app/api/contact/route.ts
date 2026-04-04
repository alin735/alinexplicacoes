import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_EMAIL, sendEmail } from '@/lib/email';

type ContactBody = {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ContactBody;
    const name = body.name?.trim();
    const email = body.email?.trim();
    const subject = body.subject?.trim();
    const message = body.message?.trim();

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: 'Preenche nome, email, assunto e mensagem.' }, { status: 400 });
    }

    const html = `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111111;">
        <h1 style="font-size:22px;margin-bottom:16px;">Novo contacto do site</h1>
        <p><strong>Nome:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Assunto:</strong> ${escapeHtml(subject)}</p>
        <p><strong>Mensagem:</strong></p>
        <div style="padding:16px;border:1px solid #e5e7eb;border-radius:12px;background:#fafafa;white-space:pre-wrap;">${escapeHtml(message)}</div>
      </div>
    `;

    await sendEmail(ADMIN_EMAIL, `Contacto do site — ${subject}`, html);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao enviar mensagem.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
