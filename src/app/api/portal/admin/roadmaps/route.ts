import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/server-bookings';
import { requirePortalAdmin } from '@/lib/portal';

export const runtime = 'nodejs';

const BUCKET = 'portal-materiais';

export async function GET() {
  if (!requirePortalAdmin()) return NextResponse.json({ error: 'Acesso reservado.' }, { status: 403 });

  const service = getServiceSupabase();
  const { data, error } = await service
    .from('portal_roadmaps')
    .select('*')
    .order('position', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ roadmaps: data });
}

export async function POST(req: NextRequest) {
  if (!requirePortalAdmin()) return NextResponse.json({ error: 'Acesso reservado.' }, { status: 403 });

  let body: { title?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Pedido inválido.' }, { status: 400 });
  }
  const title = (body.title || '').trim();
  if (!title) return NextResponse.json({ error: 'O percurso precisa de nome.' }, { status: 400 });

  const service = getServiceSupabase();
  const { data: last } = await service
    .from('portal_roadmaps')
    .select('position')
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle();
  const position = ((last as { position?: number } | null)?.position ?? -1) + 1;

  const { data, error } = await service
    .from('portal_roadmaps')
    .insert({ title, position })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ roadmap: data });
}

export async function PATCH(req: NextRequest) {
  if (!requirePortalAdmin()) return NextResponse.json({ error: 'Acesso reservado.' }, { status: 403 });

  let body: { id?: string; title?: string; position?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Pedido inválido.' }, { status: 400 });
  }
  if (!body.id) return NextResponse.json({ error: 'Falta o id.' }, { status: 400 });

  const patch: Record<string, unknown> = {};
  if ('title' in body) patch.title = (body.title || '').trim();
  if ('position' in body) patch.position = Number(body.position);

  const service = getServiceSupabase();
  const { data, error } = await service
    .from('portal_roadmaps')
    .update(patch)
    .eq('id', body.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ roadmap: data });
}

export async function DELETE(req: NextRequest) {
  if (!requirePortalAdmin()) return NextResponse.json({ error: 'Acesso reservado.' }, { status: 403 });

  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Falta o id.' }, { status: 400 });

  const service = getServiceSupabase();

  // Remove os ficheiros de todas as aulas deste percurso antes de apagar.
  const { data: lessons } = await service
    .from('portal_lessons')
    .select('id')
    .eq('roadmap_id', id);
  const lessonIds = (lessons || []).map((l: any) => l.id);
  if (lessonIds.length) {
    const { data: mats } = await service
      .from('portal_lesson_materials')
      .select('storage_path')
      .in('lesson_id', lessonIds);
    const paths = (mats || [])
      .map((m: any) => m.storage_path)
      .filter((p: string | null): p is string => Boolean(p));
    if (paths.length) await service.storage.from(BUCKET).remove(paths);
  }

  // As aulas caem por cascata (FK ON DELETE CASCADE).
  const { error } = await service.from('portal_roadmaps').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
