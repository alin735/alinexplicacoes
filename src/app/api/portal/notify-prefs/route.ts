import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/server-bookings';
import { getStudentSessionId } from '@/lib/portal-session';

export const runtime = 'nodejs';

/**
 * Preferências de notificação do aluno.
 *  - { email }   → inscreve-se e o pop-up deixa de aparecer;
 *  - { dismiss } → fecha o pop-up por agora (volta daqui a uns dias).
 */
export async function POST(req: NextRequest) {
  const studentId = getStudentSessionId();
  if (!studentId) return NextResponse.json({ error: 'Sem sessão.' }, { status: 401 });

  let body: { email?: string; dismiss?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Pedido inválido.' }, { status: 400 });
  }

  const service = getServiceSupabase();

  if (body.dismiss) {
    const { error } = await service
      .from('portal_students')
      .update({ notify_prompt_at: new Date().toISOString() })
      .eq('id', studentId);
    if (error) return NextResponse.json({ error: 'Não foi possível guardar.' }, { status: 500 });
    return NextResponse.json({ ok: true, subscribed: false });
  }

  const email = (body.email || '').trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: 'Escreve um email válido.' }, { status: 400 });
  }

  const { error } = await service
    .from('portal_students')
    .update({ email, notify_email: true, notify_prompt_at: new Date().toISOString() })
    .eq('id', studentId);
  if (error) return NextResponse.json({ error: 'Não foi possível guardar.' }, { status: 500 });

  return NextResponse.json({ ok: true, subscribed: true });
}

/** Cancelar a subscrição (a partir do link no rodapé do email). */
export async function DELETE() {
  const studentId = getStudentSessionId();
  if (!studentId) return NextResponse.json({ error: 'Sem sessão.' }, { status: 401 });

  const service = getServiceSupabase();
  const { error } = await service
    .from('portal_students')
    .update({ notify_email: false })
    .eq('id', studentId);
  if (error) return NextResponse.json({ error: 'Não foi possível guardar.' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
