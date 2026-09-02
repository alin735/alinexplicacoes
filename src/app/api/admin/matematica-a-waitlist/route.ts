import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/server-bookings';
import { requireAdminFromRequest } from '@/lib/server-admin-auth';
import { sendEmail } from '@/lib/email';
import { buildUnsubscribeHeaders, withUnsubscribeFooter } from '@/lib/email-audiences';

function errorStatus(message: string) {
  if (message.includes('Sem autenticação válida.')) return 401;
  if (message.includes('administradores') || message.includes('Sessão inválida')) return 403;
  return 500;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function broadcastEmailHtml(name: string, message: string) {
  const safeMessage = escapeHtml(message).replace(/\n/g, '<br />');
  return `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111111;">
      <p>Olá, <strong>${escapeHtml(name)}</strong>!</p>
      <div style="margin:16px 0;">${safeMessage}</div>
      <p style="margin-top:24px;color:#6b7280;font-size:13px;">Alin · MatemáticaTop · matematica.top</p>
    </div>
  `;
}

// Listar inscrições
export async function GET(req: NextRequest) {
  try {
    await requireAdminFromRequest(req);
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from('matematica_a_waitlist')
      .select('id, full_name, email, phone, status, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Não foi possível carregar a lista.' }, { status: 500 });
    }
    return NextResponse.json({ leads: data || [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao carregar a lista.';
    return NextResponse.json({ error: message }, { status: errorStatus(message) });
  }
}

// Broadcast: avisar toda a lista de espera de uma vez
export async function POST(req: NextRequest) {
  try {
    await requireAdminFromRequest(req);
    const body = (await req.json().catch(() => ({}))) as {
      subject?: string;
      message?: string;
      onlyActive?: boolean;
    };

    const subject = typeof body.subject === 'string' && body.subject.trim() ? body.subject.trim() : null;
    const message = typeof body.message === 'string' ? body.message.trim() : '';
    const onlyActive = body.onlyActive !== false; // por defeito, só quem ainda não foi contactado

    if (!subject || !message) {
      return NextResponse.json({ error: 'Falta o assunto ou a mensagem.' }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    let query = supabase.from('matematica_a_waitlist').select('id, full_name, email');
    if (onlyActive) query = query.eq('status', 'active');
    const { data: leads, error } = await query;

    if (error) {
      return NextResponse.json({ error: 'Não foi possível carregar os destinatários.' }, { status: 500 });
    }
    if (!leads || leads.length === 0) {
      return NextResponse.json({ sent: 0, failed: 0, total: 0, message: 'Não há destinatários.' });
    }

    const results = await Promise.allSettled(
      leads.map((lead) => {
        const destino = lead.email as string;
        const corpo = broadcastEmailHtml((lead.full_name as string) || destino, message);
        return sendEmail(
          destino,
          subject,
          withUnsubscribeFooter(corpo, destino, 'matematica-a-waitlist'),
          buildUnsubscribeHeaders(destino, 'matematica-a-waitlist'),
        );
      }),
    );

    const sentIds: string[] = [];
    let failed = 0;
    results.forEach((r, i) => {
      if (r.status === 'fulfilled') sentIds.push(leads[i].id as string);
      else failed += 1;
    });

    if (sentIds.length > 0) {
      await supabase
        .from('matematica_a_waitlist')
        .update({ status: 'contacted', updated_at: new Date().toISOString() })
        .in('id', sentIds);
    }

    return NextResponse.json({ sent: sentIds.length, failed, total: leads.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao enviar.';
    return NextResponse.json({ error: message }, { status: errorStatus(message) });
  }
}

// Remover uma inscrição
export async function DELETE(req: NextRequest) {
  try {
    await requireAdminFromRequest(req);
    const id = (new URL(req.url).searchParams.get('id') || '').trim();
    if (!id) {
      return NextResponse.json({ error: 'Falta o identificador.' }, { status: 400 });
    }
    const supabase = getServiceSupabase();
    const { error } = await supabase.from('matematica_a_waitlist').delete().eq('id', id);
    if (error) {
      return NextResponse.json({ error: 'Não foi possível remover.' }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao remover.';
    return NextResponse.json({ error: message }, { status: errorStatus(message) });
  }
}
