import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/server-bookings';
import { requireAdminFromRequest } from '@/lib/server-admin-auth';
import { sendEmailWithResendId } from '@/lib/email';

type ResendFailedBody = {
  campaignId?: string;
};

const SEND_BATCH_SIZE = 4;
const BATCH_DELAY_MS = 1100;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function sendNewsletterEmailWithRetry(email: string, subject: string, htmlContent: string) {
  const MAX_ATTEMPTS = 4;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      return await sendEmailWithResendId(email, subject, htmlContent);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      const isRateLimitError =
        message.includes('(429)') || message.toLowerCase().includes('rate_limit_exceeded');

      if (!isRateLimitError || attempt === MAX_ATTEMPTS) {
        throw error;
      }

      await sleep(500 * attempt);
    }
  }

  throw new Error('Erro ao enviar email.');
}

function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

export async function POST(req: NextRequest) {
  try {
    const { adminUserId } = await requireAdminFromRequest(req);
    const body = (await req.json()) as ResendFailedBody;
    const campaignId = body.campaignId?.trim();

    if (!campaignId) {
      return NextResponse.json({ error: 'campaignId é obrigatório.' }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    const { data: originalCampaign, error: campaignError } = await supabase
      .from('newsletter_campaigns')
      .select('id, subject, html_content')
      .eq('id', campaignId)
      .single();

    if (campaignError || !originalCampaign) {
      return NextResponse.json({ error: 'Campanha não encontrada.' }, { status: 404 });
    }

    const subject = String(originalCampaign.subject || '').trim();
    const htmlContent = String(originalCampaign.html_content || '').trim();
    if (!subject || !htmlContent) {
      return NextResponse.json({ error: 'A campanha original não tem conteúdo válido.' }, { status: 400 });
    }

    const { data: failedRows, error: failedError } = await supabase
      .from('newsletter_sends')
      .select('email')
      .eq('campaign_id', campaignId)
      .eq('status', 'failed');

    if (failedError) {
      return NextResponse.json({ error: 'Não foi possível carregar os envios falhados.' }, { status: 500 });
    }

    const uniqueFailedEmails = Array.from(
      new Set(
        (failedRows || [])
          .map((row) => String(row.email || '').trim().toLowerCase())
          .filter(Boolean),
      ),
    );

    if (uniqueFailedEmails.length === 0) {
      return NextResponse.json({ error: 'Esta campanha não tem falhas para reenviar.' }, { status: 400 });
    }

    const { data: retryCampaign, error: retryCampaignError } = await supabase
      .from('newsletter_campaigns')
      .insert({
        created_by: adminUserId,
        subject,
        html_content: htmlContent,
        recipient_count: uniqueFailedEmails.length,
        status: 'sending',
      })
      .select('id')
      .single();

    if (retryCampaignError || !retryCampaign) {
      return NextResponse.json({ error: 'Não foi possível criar a campanha de reenvio.' }, { status: 500 });
    }

    let sentCount = 0;
    let failedCount = 0;
    const failures: Array<{ email: string; error: string }> = [];

    for (const batch of chunkArray(uniqueFailedEmails, SEND_BATCH_SIZE)) {
      const batchResults = await Promise.all(
        batch.map(async (email) => {
          try {
            const resendId = await sendNewsletterEmailWithRetry(email, subject, htmlContent);
            return {
              email,
              status: 'sent' as const,
              resend_id: resendId,
              error_message: null as string | null,
            };
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Erro desconhecido';
            return {
              email,
              status: 'failed' as const,
              resend_id: null,
              error_message: message.slice(0, 500),
            };
          }
        }),
      );

      const sentInBatch = batchResults.filter((item) => item.status === 'sent').length;
      const failedInBatch = batchResults.length - sentInBatch;
      sentCount += sentInBatch;
      failedCount += failedInBatch;

      batchResults
        .filter((item) => item.status === 'failed')
        .forEach((item) => {
          failures.push({ email: item.email, error: item.error_message || 'Erro desconhecido' });
        });

      const { error: logError } = await supabase.from('newsletter_sends').insert(
        batchResults.map((item) => ({
          campaign_id: retryCampaign.id,
          profile_id: null,
          email: item.email,
          status: item.status,
          resend_id: item.resend_id,
          error_message: item.error_message,
        })),
      );

      if (logError) {
        return NextResponse.json({ error: 'Falha ao registar histórico dos envios.' }, { status: 500 });
      }

      await sleep(BATCH_DELAY_MS);
    }

    await supabase
      .from('newsletter_campaigns')
      .update({
        sent_count: sentCount,
        failed_count: failedCount,
        status: failedCount > 0 ? (sentCount > 0 ? 'sent' : 'failed') : 'sent',
        sent_at: new Date().toISOString(),
      })
      .eq('id', retryCampaign.id);

    return NextResponse.json({
      success: true,
      campaignId: retryCampaign.id,
      sourceCampaignId: campaignId,
      recipientCount: uniqueFailedEmails.length,
      sentCount,
      failedCount,
      failures: failures.slice(0, 10),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao reenviar falhados.';
    const status = message.includes('Sem autenticação válida.')
      ? 401
      : message.includes('administradores') || message.includes('Sessão inválida')
        ? 403
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
