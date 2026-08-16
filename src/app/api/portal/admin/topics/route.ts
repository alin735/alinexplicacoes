import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/server-bookings';
import { requirePortalAdmin } from '@/lib/portal';

export const runtime = 'nodejs';

/** Temas e subtemas de um percurso. parent_id null = tema; preenchido = subtema. */
export async function GET(req: NextRequest) {
  if (!requirePortalAdmin()) return NextResponse.json({ error: 'Acesso reservado.' }, { status: 403 });

  const roadmapId = new URL(req.url).searchParams.get('roadmap_id');
  if (!roadmapId) return NextResponse.json({ error: 'Falta o percurso.' }, { status: 400 });

  const service = getServiceSupabase();
  const { data, error } = await service
    .from('portal_topics')
    .select('*')
    .eq('roadmap_id', roadmapId)
    .order('position', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ topics: data });
}

export async function POST(req: NextRequest) {
  if (!requirePortalAdmin()) return NextResponse.json({ error: 'Acesso reservado.' }, { status: 403 });

  let body: { roadmap_id?: string; parent_id?: string | null; title?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Pedido inválido.' }, { status: 400 });
  }

  const roadmapId = (body.roadmap_id || '').trim();
  const title = (body.title || '').trim();
  const parentId = body.parent_id || null;
  if (!roadmapId) return NextResponse.json({ error: 'Falta o percurso.' }, { status: 400 });
  if (!title) return NextResponse.json({ error: 'Dá um nome ao tema.' }, { status: 400 });

  const service = getServiceSupabase();

  // Próxima posição dentro do mesmo nível (temas ou subtemas do mesmo pai).
  let posQuery = service
    .from('portal_topics')
    .select('position')
    .eq('roadmap_id', roadmapId)
    .order('position', { ascending: false })
    .limit(1);
  posQuery = parentId ? posQuery.eq('parent_id', parentId) : posQuery.is('parent_id', null);
  const { data: last } = await posQuery.maybeSingle();
  const position = ((last as { position?: number } | null)?.position ?? -1) + 1;

  const { data, error } = await service
    .from('portal_topics')
    .insert({ roadmap_id: roadmapId, parent_id: parentId, title, position })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ topic: data });
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
    .from('portal_topics')
    .update(patch)
    .eq('id', body.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ topic: data });
}

/** Apaga o tema (e subtemas por cascata). Os anexos ficam sem tema, não se perdem. */
export async function DELETE(req: NextRequest) {
  if (!requirePortalAdmin()) return NextResponse.json({ error: 'Acesso reservado.' }, { status: 403 });

  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Falta o id.' }, { status: 400 });

  const service = getServiceSupabase();
  const { error } = await service.from('portal_topics').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
