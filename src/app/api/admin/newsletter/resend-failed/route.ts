import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/server-bookings';
import { requireAdminFromRequest } from '@/lib/server-admin-auth';
import { deliverCampaign } from '@/lib/campaign-delivery';
import { isEmailAudience } from '@/lib/email-audiences';

export const maxDuration = 300;

type ResendFailedBody = {
  campaignId?: string;
};

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
      .select('id, subject, html_content, audience')
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

    // O reenvio mantém a audiência da campanha original.
    const audience = isEmailAudience(originalCampaign.audience)
      ? originalCampaign.audience
      : ('newsletter' as const);

    const { data: sendRows, error: sendsError } = await supabase
      .from('newsletter_sends')
      .select('email, status')
      .eq('campaign_id', campaignId);

    if (sendsError) {
      return NextResponse.json({ error: 'Não foi possível carregar os envios falhados.' }, { status: 500 });
    }

    const sent = new Set(
      (sendRows || [])
        .filter((row) => row.status === 'sent')
        .map((row) => String(row.email || '').trim().toLowerCase()),
    );

    // Falhados que nunca chegaram a ser enviados com sucesso nesta campanha.
    const pendingEmails = Array.from(
      new Set(
        (sendRows || [])
          .filter((row) => row.status === 'failed')
          .map((row) => String(row.email || '').trim().toLowerCase())
          .filter((email) => email.length > 0 && !sent.has(email)),
      ),
    );

    if (pendingEmails.length === 0) {
      return NextResponse.json({ error: 'Esta campanha não tem falhas para reenviar.' }, { status: 400 });
    }

    const { data: retryCampaign, error: retryCampaignError } = await supabase
      .from('newsletter_campaigns')
      .insert({
        created_by: adminUserId,
        subject,
        html_content: htmlContent,
        recipient_count: pendingEmails.length,
        audience,
        status: 'sending',
      })
      .select('id')
      .single();

    if (retryCampaignError || !retryCampaign) {
      return NextResponse.json({ error: 'Não foi possível criar a campanha de reenvio.' }, { status: 500 });
    }

    const result = await deliverCampaign({
      campaignId: retryCampaign.id,
      subject,
      htmlContent,
      audience,
      recipients: pendingEmails.map((email) => ({ email, profileId: null })),
    });

    return NextResponse.json({
      success: true,
      campaignId: retryCampaign.id,
      sourceCampaignId: campaignId,
      ...result,
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
