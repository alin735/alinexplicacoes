import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/server-bookings';
import { requirePortalAdmin } from '@/lib/portal';

export const runtime = 'nodejs';

const BUCKET = 'portal-materiais';
const VALID_KINDS = ['powerpoint', 'ficha', 'tpc', 'gravacao', 'outro'];

/**
 * Regista um material. O ficheiro (se houver) já foi enviado direto ao Supabase
 * pelo browser via URL assinado (ver `upload-url`); aqui recebemos só o
 * `storage_path`. Em alternativa, um `external_url` (ex.: link do YouTube).
 */
export async function POST(req: NextRequest) {
  if (!requirePortalAdmin()) return NextResponse.json({ error: 'Acesso reservado.' }, { status: 403 });

  let body: {
    lesson_id?: string;
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

  const lessonId = (body.lesson_id || '').trim();
  const kind = VALID_KINDS.includes(body.kind || '') ? (body.kind as string) : 'outro';
  const title = (body.title || '').trim();
  const storagePath = (body.storage_path || '').trim() || null;
  const externalUrl = (body.external_url || '').trim() || null;

  if (!lessonId) return NextResponse.json({ error: 'Falta a aula.' }, { status: 400 });
  if (!title) return NextResponse.json({ error: 'Dá um título ao material.' }, { status: 400 });
  if (!storagePath && !externalUrl) {
    return NextResponse.json({ error: 'Carrega um ficheiro ou indica um link.' }, { status: 400 });
  }

  const service = getServiceSupabase();

  const { data: last } = await service
    .from('portal_lesson_materials')
    .select('position')
    .eq('lesson_id', lessonId)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle();
  const position = ((last as { position?: number } | null)?.position ?? 0) + 1;

  const { data, error } = await service
    .from('portal_lesson_materials')
    .insert({
      lesson_id: lessonId,
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
