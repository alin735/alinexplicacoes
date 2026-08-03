import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/server-bookings';
import { verifyPin, setStudentSession } from '@/lib/portal-session';

export const runtime = 'nodejs';

/**
 * Entrar noutro dispositivo/browser: nome + PIN pessoal.
 */
export async function POST(req: NextRequest) {
  let body: { name?: string; pin?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Pedido inválido.' }, { status: 400 });
  }

  const name = (body.name || '').trim();
  const pin = (body.pin || '').trim();
  if (!name || !pin) {
    return NextResponse.json({ error: 'Indica o nome e o PIN pessoal.' }, { status: 400 });
  }

  const service = getServiceSupabase();
  const { data: students } = await service
    .from('portal_students')
    .select('id, name, pin_hash')
    .ilike('name', name);

  const match = (students || []).find((s: any) => verifyPin(pin, s.pin_hash));
  if (!match) {
    return NextResponse.json({ error: 'Nome ou PIN pessoal incorretos.' }, { status: 401 });
  }

  setStudentSession(match.id);
  return NextResponse.json({ ok: true });
}
