import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
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

function confirmationEmailHtml(name: string) {
  return `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111111;">
      <h1 style="font-size:22px;margin-bottom:12px;">Entraste na lista de espera ✅</h1>
      <p>Olá, <strong>${escapeHtml(name)}</strong>!</p>
      <p>
        Confirmamos que já entraste na lista de espera das <strong>aulas de grupo</strong> da MatemáticaTop.
      </p>
      <p>
        Quando as turmas abrirem, vais receber novidades por email.
      </p>
      <p style="margin-top:24px;color:#6b7280;font-size:13px;">
        MatemáticaTop © 2026 · matematica.top
      </p>
    </div>
  `;
}

function adminNotificationEmailHtml(name: string, email: string, preference: string | null) {
  return `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111111;">
      <h1 style="font-size:22px;margin-bottom:12px;">Nova entrada na lista de espera</h1>
      <p><strong>Nome:</strong> ${escapeHtml(name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      ${preference ? `<p><strong>Interesse:</strong> ${escapeHtml(preference)}</p>` : ''}
      <p style="margin-top:24px;color:#6b7280;font-size:13px;">
        Registo enviado automaticamente pelo site.
      </p>
    </div>
  `;
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function getActiveWaitlistCount(serviceSupabase: ReturnType<typeof getServiceSupabase>) {
  const { count, error } = await serviceSupabase
    .from('group_classes_waitlist')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'active');

  if (error) {
    throw new Error(`Não foi possível contar a lista de espera: ${error.message}`);
  }

  return count || 0;
}

export async function GET() {
  try {
    const serviceSupabase = getServiceSupabase();
    const waitlistCount = await getActiveWaitlistCount(serviceSupabase);
    return NextResponse.json({ waitlistCount });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao obter a lista de espera.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawEmail = typeof body.email === 'string' ? body.email : '';
    const preference =
      typeof body.preference === 'string' && body.preference.trim() ? body.preference.trim() : null;
    const providedName =
      typeof body.fullName === 'string' && body.fullName.trim() ? body.fullName.trim() : null;

    let userId: string | null = null;
    let resolvedEmail = rawEmail.trim();
    let resolvedName = providedName;

    const authHeader = req.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const userClient = getUserClient(authHeader);
      const { data: authData, error: authError } = await userClient.auth.getUser();
      if (!authError && authData.user) {
        const user = authData.user;
        userId = user.id;

        if (!resolvedEmail && user.email) {
          resolvedEmail = user.email;
        }

        if (!resolvedName) {
          resolvedName =
            typeof user.user_metadata?.full_name === 'string' && user.user_metadata.full_name.trim()
              ? user.user_metadata.full_name.trim()
              : typeof user.user_metadata?.username === 'string' && user.user_metadata.username.trim()
                ? user.user_metadata.username.trim()
                : null;
        }
      }
    }

    const email = normalizeEmail(resolvedEmail);
    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: 'Indica um email válido.' }, { status: 400 });
    }

    const displayName = resolvedName || email;
    const serviceSupabase = getServiceSupabase();

    const { data: existingRow, error: existingError } = await serviceSupabase
      .from('group_classes_waitlist')
      .select('id')
      .ilike('email', email)
      .maybeSingle();

    if (existingError) {
      throw new Error(`Não foi possível verificar a lista de espera: ${existingError.message}`);
    }

    if (existingRow?.id) {
      const { error: updateError } = await serviceSupabase
        .from('group_classes_waitlist')
        .update({
          user_id: userId,
          email,
          full_name: displayName,
          status: 'active',
        })
        .eq('id', existingRow.id);

      if (updateError) {
        throw new Error(`Não foi possível atualizar a lista de espera: ${updateError.message}`);
      }
    } else {
      const { error: insertError } = await serviceSupabase
        .from('group_classes_waitlist')
        .insert({
          user_id: userId,
          email,
          full_name: displayName,
          status: 'active',
        });

      if (insertError) {
        throw new Error(`Não foi possível registar na lista de espera: ${insertError.message}`);
      }
    }

    let emailWarning: string | null = null;
    try {
      await Promise.all([
        sendEmail(email, 'Lista de espera - Aulas de grupo', confirmationEmailHtml(displayName)),
        sendEmail(
          ADMIN_EMAIL,
          'Nova entrada na lista de espera (site)',
          adminNotificationEmailHtml(displayName, email, preference),
        ),
      ]);
    } catch (mailError) {
      emailWarning =
        mailError instanceof Error
          ? `Entraste na lista de espera, mas houve um problema no envio do email: ${mailError.message}`
          : 'Entraste na lista de espera, mas houve um problema no envio do email.';
    }

    const waitlistCount = await getActiveWaitlistCount(serviceSupabase);

    return NextResponse.json({
      success: true,
      message: 'Entraste na lista de espera com sucesso.',
      warning: emailWarning,
      waitlistCount,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao entrar na lista de espera.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
