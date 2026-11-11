import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_EMAIL, sendEmail } from '@/lib/email';
import { buildUnsubscribeHeaders, withUnsubscribeFooter } from '@/lib/email-audiences';
import { getServiceSupabase } from '@/lib/server-bookings';
import { travarBots } from '@/lib/anti-bot';

const AUDIENCE = 'skool-waitlist' as const;
const SCHOOL_YEARS = ['10º', '11º', '12º', 'Outro'] as const;

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
      <h1 style="font-size:22px;margin-bottom:12px;">Estás na lista do Rumo ao 20 ✅</h1>
      <p>Boas, <strong>${escapeHtml(name)}</strong>.</p>
      <p>
        Ficaste na lista de espera do <strong>Rumo ao 20</strong>. Quando abrir, és dos primeiros
        a saber. Isso dá-te vantagem: os 20 primeiros a entrar ficam como membros fundadores,
        a 19 €/mês em vez de 29 €, enquanto forem membros.
      </p>
      <p>
        Até lá não tens de fazer nada. Se quiseres ver o que ando a fazer entretanto, tens os
        vídeos no YouTube e o resto do site aqui.
      </p>
      <p>Alin</p>
      <p style="margin-top:24px;color:#6b7280;font-size:13px;">MatemáticaTop © 2026 | matematica.top</p>
    </div>
  `;
}

function adminNotificationEmailHtml(name: string, email: string, schoolYear: string | null) {
  return `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111111;">
      <h1 style="font-size:22px;margin-bottom:12px;">Nova inscrição na lista do Rumo ao 20</h1>
      <p><strong>Nome:</strong> ${escapeHtml(name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      ${schoolYear ? `<p><strong>Ano:</strong> ${escapeHtml(schoolYear)}</p>` : ''}
      <p style="margin-top:24px;color:#6b7280;font-size:13px;">
        Registo automático a partir da página /skool.
      </p>
    </div>
  `;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const travado = travarBots(req, body, { rota: 'skool-waitlist' });
    if (travado) return travado;

    const rawEmail = typeof body.email === 'string' ? body.email : '';
    const fullName =
      typeof body.fullName === 'string' && body.fullName.trim() ? body.fullName.trim() : null;
    const rawYear = typeof body.schoolYear === 'string' ? body.schoolYear.trim() : '';
    const schoolYear = (SCHOOL_YEARS as readonly string[]).includes(rawYear) ? rawYear : null;

    const email = rawEmail.trim().toLowerCase();
    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: 'Indica um email válido.' }, { status: 400 });
    }

    const displayName = fullName || email;
    const supabase = getServiceSupabase();

    const { data: existing, error: existingError } = await supabase
      .from('skool_waitlist')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingError) {
      throw new Error(`Não foi possível verificar a lista de espera: ${existingError.message}`);
    }

    if (existing?.id) {
      // Quem se volta a inscrever não cria uma linha nova nem perde a posição:
      // só atualiza o que mudou.
      const { error: updateError } = await supabase
        .from('skool_waitlist')
        .update({
          full_name: displayName,
          school_year: schoolYear,
          status: 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
      if (updateError) {
        throw new Error(`Não foi possível atualizar a lista de espera: ${updateError.message}`);
      }
    } else {
      const { error: insertError } = await supabase
        .from('skool_waitlist')
        .insert({ full_name: displayName, email, school_year: schoolYear, status: 'active' });
      if (insertError) {
        throw new Error(`Não foi possível registar na lista de espera: ${insertError.message}`);
      }
    }

    // O registo já está feito. Se o email falhar, a pessoa continua na lista e
    // só vê um aviso, em vez de perder a inscrição.
    let emailWarning: string | null = null;
    try {
      await Promise.all([
        sendEmail(
          email,
          'Estás na lista do Rumo ao 20',
          withUnsubscribeFooter(confirmationEmailHtml(displayName), email, AUDIENCE),
          buildUnsubscribeHeaders(email, AUDIENCE),
        ),
        sendEmail(
          ADMIN_EMAIL,
          `Nova inscrição — Rumo ao 20 (${displayName})`,
          adminNotificationEmailHtml(displayName, email, schoolYear),
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
