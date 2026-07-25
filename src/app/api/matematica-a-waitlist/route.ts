import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_EMAIL, sendEmail } from '@/lib/email';
import { getServiceSupabase } from '@/lib/server-bookings';

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function confirmationEmailHtml(name: string) {
  return `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111111;">
      <h1 style="font-size:22px;margin-bottom:12px;">Estás na lista de espera das Explicações de Matemática A ✅</h1>
      <p>Olá, <strong>${escapeHtml(name)}</strong>!</p>
      <p>
        Confirmamos que entraste na lista de espera das <strong>Explicações de Matemática A</strong>,
        individuais com o Alin, para o próximo ano letivo.
      </p>
      <p>Assim que abrirmos as vagas, és das primeiras pessoas a saber. Até já!</p>
      <p style="margin-top:24px;color:#6b7280;font-size:13px;">MatemáticaTop © 2026 · matematica.top</p>
    </div>
  `;
}

function adminNotificationEmailHtml(name: string, email: string, phone: string | null) {
  return `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111111;">
      <h1 style="font-size:22px;margin-bottom:12px;">Nova inscrição — Explicações de Matemática A</h1>
      <p><strong>Nome:</strong> ${escapeHtml(name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      ${phone ? `<p><strong>Telemóvel:</strong> ${escapeHtml(phone)}</p>` : ''}
      <p style="margin-top:24px;color:#6b7280;font-size:13px;">
        Registo automático a partir da página de lista de espera das Explicações de Matemática A.
      </p>
    </div>
  `;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawEmail = typeof body.email === 'string' ? body.email : '';
    const fullName =
      typeof body.fullName === 'string' && body.fullName.trim() ? body.fullName.trim() : null;
    const phone = typeof body.phone === 'string' && body.phone.trim() ? body.phone.trim() : null;

    const email = rawEmail.trim().toLowerCase();
    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: 'Indica um email válido.' }, { status: 400 });
    }

    const displayName = fullName || email;
    const supabase = getServiceSupabase();

    const { data: existing, error: existingError } = await supabase
      .from('matematica_a_waitlist')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingError) {
      throw new Error(`Não foi possível verificar a lista de espera: ${existingError.message}`);
    }

    if (existing?.id) {
      const { error: updateError } = await supabase
        .from('matematica_a_waitlist')
        .update({ full_name: displayName, phone, status: 'active', updated_at: new Date().toISOString() })
        .eq('id', existing.id);
      if (updateError) throw new Error(`Não foi possível atualizar a lista de espera: ${updateError.message}`);
    } else {
      const { error: insertError } = await supabase
        .from('matematica_a_waitlist')
        .insert({ full_name: displayName, email, phone, status: 'active' });
      if (insertError) throw new Error(`Não foi possível registar na lista de espera: ${insertError.message}`);
    }

    let emailWarning: string | null = null;
    try {
      await Promise.all([
        sendEmail(email, 'Lista de espera — Explicações de Matemática A', confirmationEmailHtml(displayName)),
        sendEmail(
          ADMIN_EMAIL,
          `Nova inscrição — Matemática A (${displayName})`,
          adminNotificationEmailHtml(displayName, email, phone),
        ),
      ]);
    } catch (mailError) {
      emailWarning =
        mailError instanceof Error
          ? `Entraste na lista, mas houve um problema no envio do email: ${mailError.message}`
          : 'Entraste na lista, mas houve um problema no envio do email.';
    }

    return NextResponse.json({ success: true, warning: emailWarning });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao entrar na lista de espera.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
