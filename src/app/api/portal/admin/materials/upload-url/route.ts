import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getServiceSupabase } from '@/lib/server-bookings';
import { requirePortalAdmin } from '@/lib/portal';

export const runtime = 'nodejs';

const BUCKET = 'portal-materiais';

function safeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-80);
}

/**
 * Gera um URL de upload assinado para o browser enviar o ficheiro DIRETAMENTE
 * ao Supabase Storage, sem passar pelo servidor (evita o limite de 4.5 MB).
 */
export async function POST(req: NextRequest) {
  if (!requirePortalAdmin()) {
    return NextResponse.json({ error: 'Acesso reservado.' }, { status: 403 });
  }

  let body: { lesson_id?: string; filename?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Pedido inválido.' }, { status: 400 });
  }

  const lessonId = (body.lesson_id || '').trim();
  const filename = (body.filename || '').trim();
  if (!lessonId || !filename) {
    return NextResponse.json({ error: 'Falta a aula ou o nome do ficheiro.' }, { status: 400 });
  }

  const path = `${lessonId}/${randomUUID()}-${safeName(filename)}`;
  const service = getServiceSupabase();
  const { data, error } = await service.storage.from(BUCKET).createSignedUploadUrl(path);

  if (error || !data) {
    return NextResponse.json({ error: error?.message || 'Erro a preparar o upload.' }, { status: 500 });
  }

  return NextResponse.json({ path: data.path, token: data.token });
}
