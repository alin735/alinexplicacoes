import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/server-bookings';
import { requireAdminFromRequest } from '@/lib/server-admin-auth';
import { sendEmailWithResendId } from '@/lib/email';

type SendOpeningWaitlistBody = {
  subject?: string;
  htmlContent?: string;
};

const SEND_BATCH_SIZE = 4;
const BATCH_DELAY_MS = 1100;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

async function sendWaitlistEmailWithRetry(email: string, subject: string, htmlContent: string) {
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

export async function POST(req: NextRequest) {
  try {
    const { adminUserId } = await requireAdminFromRequest(req);
    const body = (await req.json()) as SendOpeningWaitlistBody;
    const subject = body.subject?.trim();
    const htmlContent = body.htmlContent?.trim();

    if (!subject || !htmlContent) {
      return NextResponse.json({ error: 'Assunto e conteúdo são obrigatórios.' }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    const { data: waitlistRows, error: waitlistError } = await supabase
      .from('group_classes_waitlist')
      .select('email')
      .eq('status', 'active');

    if (waitlistError) {
      return NextResponse.json({ error: 'Não foi possível carregar a lista de espera.' }, { status: 500 });
    }

    const uniqueEmails = Array.from(
      new Set(
        (waitlistRows || [])
          .map((row) => String(row.email || '').trim().toLowerCase())
          .filter((email) => email.length > 0),
      ),
    );

    if (uniqueEmails.length === 0) {
      return NextResponse.json({ error: 'Não existem emails ativos na lista de espera.' }, { status: 400 });
    }

    const { data: campaign, error: campaignError } = await supabase
      .from('newsletter_campaigns')
      .insert({
        created_by: adminUserId,
        subject,
        html_content: htmlContent,
        recipient_count: uniqueEmails.length,
        status: 'sending',
      })
      .select('id')
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json({ error: 'Não foi possível criar a campanha.' }, { status: 500 });
    }

    let sentCount = 0;
    let failedCount = 0;
    const failures: Array<{ email: string; error: string }> = [];

    for (const batch of chunkArray(uniqueEmails, SEND_BATCH_SIZE)) {
      const batchResults = await Promise.all(
        batch.map(async (email) => {
          try {
            const resendId = await sendWaitlistEmailWithRetry(email, subject, htmlContent);
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
          campaign_id: campaign.id,
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
      .eq('id', campaign.id);

    return NextResponse.json({
      success: true,
      campaignId: campaign.id,
      recipientCount: uniqueEmails.length,
      sentCount,
      failedCount,
      failures: failures.slice(0, 10),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao enviar anúncio para a lista de espera.';
    const status = message.includes('Sem autenticação válida.')
      ? 401
      : message.includes('administradores') || message.includes('Sessão inválida')
        ? 403
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
