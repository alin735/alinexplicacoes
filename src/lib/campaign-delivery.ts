import { getServiceSupabase } from '@/lib/server-bookings';
import { sendEmailBatch, sendEmailWithResendId } from '@/lib/email';
import {
  EmailAudience,
  buildUnsubscribeHeaders,
  withUnsubscribeFooter,
} from '@/lib/email-audiences';

export type CampaignRecipient = {
  email: string;
  profileId?: string | null;
  fullName?: string | null;
  course?: string | null;
};

export type DeliveryResult = {
  recipientCount: number;
  sentCount: number;
  failedCount: number;
  skippedCount: number;
  optedOutCount: number;
  failures: Array<{ email: string; error: string }>;
};

/** O endpoint batch do Resend aceita 100 emails por pedido. */
const BATCH_SIZE = 100;
/** Pausa entre pedidos, para ficar abaixo do limite de pedidos por segundo. */
const BATCH_DELAY_MS = 600;
const MAX_BATCH_ATTEMPTS = 4;

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

function isRateLimitError(message: string) {
  return message.includes('(429)') || message.toLowerCase().includes('rate_limit_exceeded');
}

function normalizeEmail(value: unknown) {
  return String(value || '').trim().toLowerCase();
}

/** Emails com um erro de escrita óbvio no domínio nunca vão chegar a lado nenhum. */
function looksSendable(email: string) {
  return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email) && !/@gmail\.(con|cm|co)$/i.test(email);
}

/**
 * Quem cancelou a subscrição de uma audiência, ou de tudo.
 * A tabela é pequena, por isso lê-se inteira e filtra-se em memória.
 */
export async function loadOptedOutEmails(audience: EmailAudience): Promise<Set<string>> {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from('email_optouts')
    .select('email, audience')
    .in('audience', ['all', audience]);

  if (error) {
    throw new Error(
      'Não foi possível verificar os cancelamentos de subscrição. Corre a migração email_optouts antes de enviar.',
    );
  }

  return new Set((data || []).map((row) => normalizeEmail(row.email)).filter(Boolean));
}

/**
 * Entrega uma campanha já criada e fecha-a sempre, mesmo que algo rebente
 * a meio. Reentrante: quem já consta como enviado nesta campanha é saltado,
 * por isso relançar não duplica emails.
 */
export async function deliverCampaign(options: {
  campaignId: string;
  subject: string;
  htmlContent: string;
  audience: EmailAudience;
  recipients: CampaignRecipient[];
  /**
   * Para campanhas em que cada pessoa recebe um email diferente (nome,
   * curso, link próprio). Sem isto, toda a gente recebe htmlContent.
   */
  renderHtml?: (recipient: CampaignRecipient) => string;
  /** Idem para o assunto. */
  renderSubject?: (recipient: CampaignRecipient) => string;
}): Promise<DeliveryResult> {
  const { campaignId, subject, htmlContent, audience } = options;
  const renderHtml = options.renderHtml || (() => htmlContent);
  const renderSubject = options.renderSubject || (() => subject);
  const supabase = getServiceSupabase();

  const uniqueByEmail = new Map<string, CampaignRecipient>();
  options.recipients.forEach((recipient) => {
    const email = normalizeEmail(recipient.email);
    if (!email || !looksSendable(email)) return;
    if (!uniqueByEmail.has(email)) {
      uniqueByEmail.set(email, { ...recipient, email, profileId: recipient.profileId ?? null });
    }
  });

  const optedOut = await loadOptedOutEmails(audience);
  let optedOutCount = 0;
  optedOut.forEach((email) => {
    if (uniqueByEmail.delete(email)) optedOutCount += 1;
  });

  const { data: alreadyLogged } = await supabase
    .from('newsletter_sends')
    .select('email')
    .eq('campaign_id', campaignId)
    .eq('status', 'sent');

  let skippedCount = 0;
  (alreadyLogged || []).forEach((row) => {
    if (uniqueByEmail.delete(normalizeEmail(row.email))) skippedCount += 1;
  });

  const recipients = Array.from(uniqueByEmail.values());

  let sentCount = 0;
  let failedCount = 0;
  const failures: Array<{ email: string; error: string }> = [];

  const logResults = async (
    rows: Array<{
      profile_id: string | null;
      email: string;
      status: 'sent' | 'failed';
      resend_id: string | null;
      error_message: string | null;
    }>,
  ) => {
    if (rows.length === 0) return;
    await supabase.from('newsletter_sends').upsert(
      rows.map((row) => ({ campaign_id: campaignId, ...row })),
      { onConflict: 'campaign_id,email', ignoreDuplicates: false },
    );
  };

  try {
    for (const batch of chunkArray(recipients, BATCH_SIZE)) {
      const messages = batch.map((recipient) => ({
        to: recipient.email,
        subject: renderSubject(recipient),
        html: withUnsubscribeFooter(renderHtml(recipient), recipient.email, audience),
        headers: buildUnsubscribeHeaders(recipient.email, audience),
      }));

      let ids: Array<string | null> | null = null;
      let batchError = '';

      for (let attempt = 1; attempt <= MAX_BATCH_ATTEMPTS; attempt += 1) {
        try {
          ids = await sendEmailBatch(messages);
          batchError = '';
          break;
        } catch (error) {
          batchError = error instanceof Error ? error.message : 'Erro desconhecido';
          if (!isRateLimitError(batchError) || attempt === MAX_BATCH_ATTEMPTS) break;
          await sleep(700 * attempt);
        }
      }

      if (ids) {
        const rows = batch.map((recipient, index) => ({
          profile_id: recipient.profileId ?? null,
          email: recipient.email,
          status: 'sent' as const,
          resend_id: ids?.[index] ?? null,
          error_message: null,
        }));
        sentCount += rows.length;
        await logResults(rows);
      } else {
        // O lote inteiro falhou. Tenta um a um para não perder a lista toda
        // por causa de um único email problemático.
        const rows = await Promise.all(
          batch.map(async (recipient, index) => {
            try {
              const resendId = await sendEmailWithResendId(
                recipient.email,
                messages[index].subject,
                messages[index].html,
                messages[index].headers,
              );
              return {
                profile_id: recipient.profileId ?? null,
                email: recipient.email,
                status: 'sent' as const,
                resend_id: resendId,
                error_message: null as string | null,
              };
            } catch (error) {
              const message = error instanceof Error ? error.message : batchError;
              return {
                profile_id: recipient.profileId ?? null,
                email: recipient.email,
                status: 'failed' as const,
                resend_id: null,
                error_message: message.slice(0, 500),
              };
            }
          }),
        );

        rows.forEach((row) => {
          if (row.status === 'sent') {
            sentCount += 1;
          } else {
            failedCount += 1;
            failures.push({ email: row.email, error: row.error_message || 'Erro desconhecido' });
          }
        });

        await logResults(rows);
      }

      await sleep(BATCH_DELAY_MS);
    }
  } finally {
    // Fecha sempre a campanha. Ficar presa em 'sending' esconde o que
    // realmente saiu e impede o reenvio dos falhados.
    await supabase
      .from('newsletter_campaigns')
      .update({
        sent_count: sentCount + skippedCount,
        failed_count: failedCount,
        status: sentCount + skippedCount > 0 ? 'sent' : 'failed',
        sent_at: new Date().toISOString(),
      })
      .eq('id', campaignId);
  }

  return {
    recipientCount: recipients.length,
    sentCount,
    failedCount,
    skippedCount,
    optedOutCount,
    failures: failures.slice(0, 10),
  };
}
