import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/server-bookings';
import { requireAdminFromRequest } from '@/lib/server-admin-auth';
import { sendEmailWithResendId } from '@/lib/email';

type SendNewsletterBody = {
  subject?: string;
  htmlContent?: string;
};

const SEND_BATCH_SIZE = 30;

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
    const body = (await req.json()) as SendNewsletterBody;
    const subject = body.subject?.trim();
    const htmlContent = body.htmlContent?.trim();

    if (!subject || !htmlContent) {
      return NextResponse.json({ error: 'Assunto e conteúdo são obrigatórios.' }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    const { data: optedProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('newsletter_opt_in', true)
      .not('email', 'is', null);

    if (profilesError) {
      return NextResponse.json({ error: 'Não foi possível carregar os subscritores.' }, { status: 500 });
    }

    const uniqueByEmail = new Map<string, { profileId: string; email: string }>();

    (optedProfiles || [])
      .map((profile) => ({
        profileId: profile.id as string,
        email: String(profile.email || '').trim(),
      }))
      .filter((item) => item.email.length > 0)
      .forEach((item) => {
        const key = item.email.toLowerCase();
        if (!uniqueByEmail.has(key)) {
          uniqueByEmail.set(key, item);
        }
      });

    const recipients = Array.from(uniqueByEmail.values());

    if (recipients.length === 0) {
      return NextResponse.json({ error: 'Não existem subscritores com email válido.' }, { status: 400 });
    }

    const { data: campaign, error: campaignError } = await supabase
      .from('newsletter_campaigns')
      .insert({
        created_by: adminUserId,
        subject,
        html_content: htmlContent,
        recipient_count: recipients.length,
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

    for (const batch of chunkArray(recipients, SEND_BATCH_SIZE)) {
      const batchResults = await Promise.all(
        batch.map(async (recipient) => {
          try {
            const resendId = await sendEmailWithResendId(recipient.email, subject, htmlContent);
            return {
              profile_id: recipient.profileId,
              email: recipient.email,
              status: 'sent' as const,
              resend_id: resendId,
              error_message: null as string | null,
            };
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Erro desconhecido';
            return {
              profile_id: recipient.profileId,
              email: recipient.email,
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
          profile_id: item.profile_id,
          email: item.email,
          status: item.status,
          resend_id: item.resend_id,
          error_message: item.error_message,
        })),
      );

      if (logError) {
        return NextResponse.json({ error: 'Falha ao registar histórico dos envios.' }, { status: 500 });
      }
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
      recipientCount: recipients.length,
      sentCount,
      failedCount,
      failures: failures.slice(0, 10),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao enviar newsletter.';
    const status = message.includes('Sem autenticação válida.')
      ? 401
      : message.includes('administradores') || message.includes('Sessão inválida')
        ? 403
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
