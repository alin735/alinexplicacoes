import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/server-bookings';
import { requirePortalAdmin } from '@/lib/portal';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  if (!requirePortalAdmin()) return NextResponse.json({ error: 'Acesso reservado.' }, { status: 403 });

  const roadmapId = new URL(req.url).searchParams.get('roadmap_id');

  const service = getServiceSupabase();
  let query = service
    .from('portal_lessons')
    .select('*, portal_lesson_materials(*)')
    .order('position', { ascending: true });
  if (roadmapId) query = query.eq('roadmap_id', roadmapId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ lessons: data });
}

export async function POST(req: NextRequest) {
  if (!requirePortalAdmin()) return NextResponse.json({ error: 'Acesso reservado.' }, { status: 403 });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Pedido inválido.' }, { status: 400 });
  }

  const title = (body.title || '').trim();
  if (!title) return NextResponse.json({ error: 'A aula precisa de título.' }, { status: 400 });
  const roadmapId = (body.roadmap_id || '').trim();
  if (!roadmapId) return NextResponse.json({ error: 'Falta o percurso.' }, { status: 400 });

  const service = getServiceSupabase();

  // Próxima posição dentro deste percurso.
  const { data: last } = await service
    .from('portal_lessons')
    .select('position')
    .eq('roadmap_id', roadmapId)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle();
  const position = ((last as { position?: number } | null)?.position ?? 0) + 1;

  const { data, error } = await service
    .from('portal_lessons')
    .insert({
      roadmap_id: roadmapId,
      title,
      subtitle: (body.subtitle || '').trim() || null,
      contents: (body.contents || '').trim() || null,
      scheduled_at: body.scheduled_at || null,
      position,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ lesson: data });
}

export async function PATCH(req: NextRequest) {
  if (!requirePortalAdmin()) return NextResponse.json({ error: 'Acesso reservado.' }, { status: 403 });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Pedido inválido.' }, { status: 400 });
  }

  const id = body.id;
  if (!id) return NextResponse.json({ error: 'Falta o id.' }, { status: 400 });

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if ('title' in body) patch.title = (body.title || '').trim();
  if ('subtitle' in body) patch.subtitle = (body.subtitle || '').trim() || null;
  if ('contents' in body) patch.contents = (body.contents || '').trim() || null;
  if ('scheduled_at' in body) patch.scheduled_at = body.scheduled_at || null;
  if ('is_unlocked' in body) patch.is_unlocked = Boolean(body.is_unlocked);
  if ('position' in body) patch.position = Number(body.position);

  const service = getServiceSupabase();
  const { data, error } = await service
    .from('portal_lessons')
    .update(patch)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ lesson: data });
}

export async function DELETE(req: NextRequest) {
  if (!requirePortalAdmin()) return NextResponse.json({ error: 'Acesso reservado.' }, { status: 403 });

  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Falta o id.' }, { status: 400 });

  const service = getServiceSupabase();

  // Remove os ficheiros associados do storage antes de apagar a aula.
  const { data: mats } = await service
    .from('portal_lesson_materials')
    .select('storage_path')
    .eq('lesson_id', id);
  const paths = (mats || [])
    .map((m: any) => m.storage_path)
    .filter((p: string | null): p is string => Boolean(p));
  if (paths.length) {
    await service.storage.from('portal-materiais').remove(paths);
  }

  const { error } = await service.from('portal_lessons').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
