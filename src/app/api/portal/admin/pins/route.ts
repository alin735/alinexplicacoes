import { NextRequest, NextResponse } from 'next/server';
import { randomInt } from 'crypto';
import { getServiceSupabase } from '@/lib/server-bookings';
import { requirePortalAdmin } from '@/lib/portal';

export const runtime = 'nodejs';

// Sem caracteres ambíguos (0/O, 1/I).
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateCode(): string {
  const pick = () => ALPHABET[randomInt(ALPHABET.length)];
  const block = (n: number) => Array.from({ length: n }, pick).join('');
  return `${block(4)}-${block(2)}`;
}

export async function GET() {
  if (!requirePortalAdmin()) return NextResponse.json({ error: 'Acesso reservado.' }, { status: 403 });

  const service = getServiceSupabase();
  const { data, error } = await service
    .from('portal_pins')
    .select('id, code, label, used_by, used_at, created_at, portal_students(name)')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ pins: data });
}

export async function POST(req: NextRequest) {
  if (!requirePortalAdmin()) return NextResponse.json({ error: 'Acesso reservado.' }, { status: 403 });

  let body: { label?: string; count?: number };
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const label = (body.label || '').trim() || null;
  const count = Math.min(Math.max(Number(body.count) || 1, 1), 50);

  const service = getServiceSupabase();
  const rows = Array.from({ length: count }, () => ({
    code: generateCode(),
    label,
  }));

  const { data, error } = await service.from('portal_pins').insert(rows).select();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ pins: data });
}

export async function DELETE(req: NextRequest) {
  if (!requirePortalAdmin()) return NextResponse.json({ error: 'Acesso reservado.' }, { status: 403 });

  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Falta o id.' }, { status: 400 });

  const service = getServiceSupabase();
  // Só apaga PINs por usar.
  const { error } = await service.from('portal_pins').delete().eq('id', id).is('used_by', null);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
