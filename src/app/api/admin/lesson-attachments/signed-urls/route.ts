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

    for (const item of attachments) {
      const id = item.id?.trim();
      const fileUrl = item.fileUrl?.trim();
      if (!id || !fileUrl) continue;

      const storagePath = extractStoragePath(fileUrl);
      if (!storagePath) continue;

      const { data: signedData } = await service.storage
        .from('lesson-files')
        .createSignedUrl(storagePath, 60 * 60 * 24);

      if (signedData?.signedUrl) {
        urls[id] = signedData.signedUrl;
      }
    }

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
