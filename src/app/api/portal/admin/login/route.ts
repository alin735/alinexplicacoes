import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminCode, setAdminSession, clearAdminSession } from '@/lib/portal-session';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  let body: { code?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Pedido inválido.' }, { status: 400 });
  }

  const code = (body.code || '').trim();
  if (!code || !verifyAdminCode(code)) {
    return NextResponse.json({ error: 'Código de admin incorreto.' }, { status: 401 });
  }

  setAdminSession();
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  clearAdminSession();
  return NextResponse.json({ ok: true });
}
