import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_EMAIL, sendEmail } from '@/lib/email';

type LeadBody = {
  name?: string;
  email?: string;
  phone?: string;
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
    const body = (await req.json()) as LeadBody;
    const name = body.name?.trim();
    const email = body.email?.trim();
    const phone = body.phone?.trim();
    const message = body.message?.trim();

    if (!name || !email || !phone || !message) {
      return NextResponse.json(
        { error: 'Preenche o nome, o email, o telemóvel e a mensagem.' },
        { status: 400 },
      );
    }

    const html = `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111111;">
        <h1 style="font-size:22px;margin-bottom:16px;">Novo pedido de explicações</h1>
        <p><strong>Nome:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Telemóvel:</strong> ${escapeHtml(phone)}</p>
        <p><strong>Mensagem:</strong></p>
        <div style="padding:16px;border:1px solid #e5e7eb;border-radius:12px;background:#fafafa;white-space:pre-wrap;">${escapeHtml(message)}</div>
        <p style="margin-top:20px;color:#6b7280;font-size:13px;">Pedido enviado através da página de Explicações do site.</p>
      </div>
    `;

    await sendEmail(ADMIN_EMAIL, `Pedido de explicações — ${name}`, html);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao enviar o pedido.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
