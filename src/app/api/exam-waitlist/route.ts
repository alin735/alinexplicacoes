import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_EMAIL, sendEmail } from '@/lib/email';
import { getServiceSupabase } from '@/lib/server-bookings';

const DEFAULT_SOURCE = 'correcao-prova-matematica-9-ano-2026';

// Aceita uma origem do corpo do pedido (ex.: "segunda-fase-9-ano" para o CTA do
// TikTok), sanitizada para um slug seguro. Sem origem válida, usa a predefinição.
function parseSource(value: unknown): string {
  if (typeof value !== 'string') return DEFAULT_SOURCE;
  const cleaned = value.trim().toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 64);
  return cleaned || DEFAULT_SOURCE;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function confirmationEmailHtml(name: string, course: string | null) {
  return `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111111;">
      <h1 style="font-size:22px;margin-bottom:12px;">Estás na lista de espera das Explicações Top ✅</h1>
      <p>Olá, <strong>${escapeHtml(name)}</strong>!</p>
      <p>
        Confirmamos que entraste na lista de espera das <strong>Explicações Top da MatemáticaTop</strong>${
          course ? ` para <strong>${escapeHtml(course)}</strong>` : ''
        }.
      </p>
      <p>
        Vamos fornecer explicações de qualidade para praticamente todas as disciplinas, a um preço
        acessível. Assim que abrirmos as vagas, és das primeiras pessoas a saber.
      </p>
      <p style="margin-top:24px;color:#6b7280;font-size:13px;">
        MatemáticaTop © 2026 · matematica.top
      </p>
    </div>
  `;
}

function adminNotificationEmailHtml(name: string, email: string, phone: string | null, course: string | null) {
  return `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111111;">
      <h1 style="font-size:22px;margin-bottom:12px;">Nova inscrição — Explicações Top (correção 9.º ano)</h1>
      <p><strong>Nome:</strong> ${escapeHtml(name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      ${phone ? `<p><strong>Telemóvel:</strong> ${escapeHtml(phone)}</p>` : ''}
      ${course ? `<p><strong>Curso/disciplina:</strong> ${escapeHtml(course)}</p>` : ''}
      <p style="margin-top:24px;color:#6b7280;font-size:13px;">
        Registo automático a partir da página de correção da prova de Matemática do 9.º ano.
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
    const course = typeof body.course === 'string' && body.course.trim() ? body.course.trim() : null;
    const source = parseSource(body.source);

    const email = normalizeEmail(rawEmail);
    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: 'Indica um email válido.' }, { status: 400 });
    }

    const displayName = fullName || email;
    const serviceSupabase = getServiceSupabase();

    const { data: existingRow, error: existingError } = await serviceSupabase
      .from('exam_correction_waitlist')
      .select('id')
      .ilike('email', email)
      .maybeSingle();

    if (existingError) {
      throw new Error(`Não foi possível verificar a lista de espera: ${existingError.message}`);
    }

    if (existingRow?.id) {
      const { error: updateError } = await serviceSupabase
        .from('exam_correction_waitlist')
        .update({
          full_name: displayName,
          email,
          phone,
          course,
          source,
          status: 'active',
        })
        .eq('id', existingRow.id);

      if (updateError) {
        throw new Error(`Não foi possível atualizar a lista de espera: ${updateError.message}`);
      }
    } else {
      const { error: insertError } = await serviceSupabase
        .from('exam_correction_waitlist')
        .insert({
          full_name: displayName,
          email,
          phone,
          course,
          source,
          status: 'active',
        });

      if (insertError) {
        throw new Error(`Não foi possível registar na lista de espera: ${insertError.message}`);
      }
    }

    let emailWarning: string | null = null;
    try {
      await Promise.all([
        sendEmail(email, 'Lista de espera — Explicações Top', confirmationEmailHtml(displayName, course)),
        sendEmail(
          ADMIN_EMAIL,
          `Nova inscrição — Explicações Top (${displayName})`,
          adminNotificationEmailHtml(displayName, email, phone, course),
        ),
      ]);
    } catch (mailError) {
      emailWarning =
        mailError instanceof Error
          ? `Entraste na lista de espera, mas houve um problema no envio do email: ${mailError.message}`
          : 'Entraste na lista de espera, mas houve um problema no envio do email.';
    }

    return NextResponse.json({
      success: true,
      message: 'Entraste na lista de espera com sucesso.',
      warning: emailWarning,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao entrar na lista de espera.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
