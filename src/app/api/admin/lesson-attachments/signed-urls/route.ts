import { NextRequest, NextResponse } from 'next/server';
import { requireAdminFromRequest } from '@/lib/server-admin-auth';
import { getServiceSupabase } from '@/lib/server-bookings';

type SignedUrlRequest = {
  attachments?: Array<{
    id?: string;
    fileUrl?: string;
  }>;
};

function extractStoragePath(fileUrl: string): string | null {
  const marker = '/object/public/lesson-files/';
  const idx = fileUrl.indexOf(marker);
  if (idx !== -1) return fileUrl.substring(idx + marker.length);

  const marker2 = '/object/sign/lesson-files/';
  const idx2 = fileUrl.indexOf(marker2);
  if (idx2 !== -1) return fileUrl.substring(idx2 + marker2.length).split('?')[0];

  return null;
}

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    await requireAdminFromRequest(req);
    const body = (await req.json()) as SignedUrlRequest;
    const attachments = Array.isArray(body.attachments) ? body.attachments : [];

    if (attachments.length === 0) {
      return NextResponse.json({ urls: {} });
    }

    const service = getServiceSupabase();
    const urls: Record<string, string> = {};

    // Um pedido por anexo esgotava o tempo da função assim que passaram de
    // umas dezenas. Assinar tudo de uma vez é um único pedido ao Storage.
    const idsByPath = new Map<string, string[]>();
    attachments.forEach((item) => {
      const id = item.id?.trim();
      const fileUrl = item.fileUrl?.trim();
      if (!id || !fileUrl) return;

      const storagePath = extractStoragePath(fileUrl);
      if (!storagePath) return;

      const existing = idsByPath.get(storagePath);
      if (existing) existing.push(id);
      else idsByPath.set(storagePath, [id]);
    });

    const paths = Array.from(idsByPath.keys());
    if (paths.length === 0) {
      return NextResponse.json({ urls });
    }

    const { data: signedList, error: signError } = await service.storage
      .from('lesson-files')
      .createSignedUrls(paths, 60 * 60 * 24);

    if (signError) {
      return NextResponse.json({ error: 'Não foi possível gerar os links dos anexos.' }, { status: 500 });
    }

    (signedList || []).forEach((entry) => {
      // O Storage devolve o caminho de cada item, e pode falhar item a item.
      if (!entry?.signedUrl || !entry.path) return;
      (idsByPath.get(entry.path) || []).forEach((id) => {
        urls[id] = entry.signedUrl as string;
      });
    });

    return NextResponse.json({ urls });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao gerar links dos anexos.';
    const status = message.includes('Sem autenticação válida.')
      ? 401
      : message.includes('administradores') || message.includes('Sessão inválida')
        ? 403
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
