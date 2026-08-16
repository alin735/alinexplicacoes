import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/server-bookings';
import { requirePortalAdmin } from '@/lib/portal';

export const runtime = 'nodejs';

const BUCKET = 'portal-materiais';
const VALID_KINDS = ['powerpoint', 'ficha', 'tpc', 'gravacao', 'importante', 'outro'];

/**
 * Anexos "Importante" de um percurso: os das aulas DESBLOQUEADAS desse percurso
 * mais os itens avulsos ligados diretamente ao percurso.
 */
export async function GET(req: NextRequest) {
  if (!requirePortalAdmin()) return NextResponse.json({ error: 'Acesso reservado.' }, { status: 403 });

  const roadmapId = new URL(req.url).searchParams.get('roadmap_id');
  if (!roadmapId) return NextResponse.json({ error: 'Falta o percurso.' }, { status: 400 });

  const service = getServiceSupabase();
  const { data: lessons } = await service
    .from('portal_lessons')
    .select('id, title, position, is_unlocked')
    .eq('roadmap_id', roadmapId);
  const lessonIds = (lessons || []).map((l: any) => l.id);

  const { data, error } = await service
    .from('portal_lesson_materials')
    .select('*')
    .eq('kind', 'importante')
    .or(
      lessonIds.length
        ? `roadmap_id.eq.${roadmapId},lesson_id.in.(${lessonIds.join(',')})`
        : `roadmap_id.eq.${roadmapId}`,
    )
    .order('position', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ materials: data, lessons });
}

/**
 * Regista um material. O ficheiro (se houver) já foi enviado direto ao Supabase
 * pelo browser via URL assinado (ver `upload-url`); aqui recebemos só o
 * `storage_path`. Em alternativa, um `external_url` (ex.: link do YouTube).
 */
export async function POST(req: NextRequest) {
  if (!requirePortalAdmin()) return NextResponse.json({ error: 'Acesso reservado.' }, { status: 403 });

  let body: {
    lesson_id?: string;
    roadmap_id?: string;
    topic_id?: string | null;
    kind?: string;
    title?: string;
    storage_path?: string;
    external_url?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Pedido inválido.' }, { status: 400 });
  }

  // Um material pertence a uma aula OU (item avulso "Importante") a um percurso.
  const lessonId = (body.lesson_id || '').trim() || null;
  const roadmapId = (body.roadmap_id || '').trim() || null;
  const kind = VALID_KINDS.includes(body.kind || '') ? (body.kind as string) : 'outro';
  const title = (body.title || '').trim();
  const storagePath = (body.storage_path || '').trim() || null;
  const externalUrl = (body.external_url || '').trim() || null;
  const topicId = body.topic_id || null;

  if (!lessonId && !roadmapId) {
    return NextResponse.json({ error: 'Falta a aula ou o percurso.' }, { status: 400 });
  }
  if (!title) return NextResponse.json({ error: 'Dá um título ao material.' }, { status: 400 });
  if (!storagePath && !externalUrl) {
    return NextResponse.json({ error: 'Carrega um ficheiro ou indica um link.' }, { status: 400 });
  }

  const service = getServiceSupabase();

  const posQuery = service
    .from('portal_lesson_materials')
    .select('position')
    .order('position', { ascending: false })
    .limit(1);
  const { data: last } = await (lessonId
    ? posQuery.eq('lesson_id', lessonId)
    : posQuery.eq('roadmap_id', roadmapId!)
  ).maybeSingle();
  const position = ((last as { position?: number } | null)?.position ?? 0) + 1;

  const { data, error } = await service
    .from('portal_lesson_materials')
    .insert({
      lesson_id: lessonId,
      roadmap_id: lessonId ? null : roadmapId,
      topic_id: topicId,
      kind,
      title,
      storage_path: storagePath,
      external_url: storagePath ? null : externalUrl,
      position,
    })
    .select()
    .single();

  if (error) {
    if (storagePath) await service.storage.from(BUCKET).remove([storagePath]);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ material: data });
}

/** Atualiza um anexo (usado sobretudo para lhe atribuir tema/subtema). */
export async function PATCH(req: NextRequest) {
  if (!requirePortalAdmin()) return NextResponse.json({ error: 'Acesso reservado.' }, { status: 403 });

  let body: { id?: string; topic_id?: string | null; title?: string; kind?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Pedido inválido.' }, { status: 400 });
  }
  if (!body.id) return NextResponse.json({ error: 'Falta o id.' }, { status: 400 });

  const patch: Record<string, unknown> = {};
  if ('topic_id' in body) patch.topic_id = body.topic_id || null;
  if ('title' in body) patch.title = (body.title || '').trim();
  if ('kind' in body && VALID_KINDS.includes(body.kind || '')) patch.kind = body.kind;

  const service = getServiceSupabase();
  const { data, error } = await service
    .from('portal_lesson_materials')
    .update(patch)
    .eq('id', body.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ material: data });
}

export async function DELETE(req: NextRequest) {
  if (!requirePortalAdmin()) return NextResponse.json({ error: 'Acesso reservado.' }, { status: 403 });

  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Falta o id.' }, { status: 400 });

  const service = getServiceSupabase();
  const { data: mat } = await service
    .from('portal_lesson_materials')
    .select('storage_path')
    .eq('id', id)
    .maybeSingle();

  const path = (mat as { storage_path?: string | null } | null)?.storage_path;
  if (path) await service.storage.from(BUCKET).remove([path]);

  const { error } = await service.from('portal_lesson_materials').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
