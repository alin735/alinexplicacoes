import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/server-bookings';
import { requirePortalAdmin } from '@/lib/portal';

export const runtime = 'nodejs';

export async function GET() {
  if (!requirePortalAdmin()) return NextResponse.json({ error: 'Acesso reservado.' }, { status: 403 });

  const service = getServiceSupabase();
  const { data, error } = await service
    .from('portal_students')
    .select('id, name, created_at, roadmap_id, preview_all')
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ students: data });
}

export async function PATCH(req: NextRequest) {
  if (!requirePortalAdmin()) return NextResponse.json({ error: 'Acesso reservado.' }, { status: 403 });

  let body: { id?: string; roadmap_id?: string | null; preview_all?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Pedido inválido.' }, { status: 400 });
  }
  if (!body.id) return NextResponse.json({ error: 'Falta o id.' }, { status: 400 });

  const patch: Record<string, unknown> = {};
  if ('roadmap_id' in body) patch.roadmap_id = body.roadmap_id || null;
  if ('preview_all' in body) patch.preview_all = Boolean(body.preview_all);

  const service = getServiceSupabase();
  const { data, error } = await service
    .from('portal_students')
    .update(patch)
    .eq('id', body.id)
    .select('id, name, created_at, roadmap_id, preview_all')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ student: data });
}

export async function DELETE(req: NextRequest) {
  if (!requirePortalAdmin()) return NextResponse.json({ error: 'Acesso reservado.' }, { status: 403 });

  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Falta o id.' }, { status: 400 });

  const service = getServiceSupabase();
  const { error } = await service.from('portal_students').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
