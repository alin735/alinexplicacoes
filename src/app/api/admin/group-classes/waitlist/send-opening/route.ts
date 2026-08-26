import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/server-bookings';
import { requireAdminFromRequest } from '@/lib/server-admin-auth';
import { deliverCampaign } from '@/lib/campaign-delivery';

export const maxDuration = 300;

type SendOpeningWaitlistBody = {
  subject?: string;
  htmlContent?: string;
};

/** Lista de espera das aulas de grupo. Audiência própria, à parte da newsletter. */
const AUDIENCE = 'group-classes-waitlist' as const;

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
        audience: AUDIENCE,
        status: 'sending',
      })
      .select('id')
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json({ error: 'Não foi possível criar a campanha.' }, { status: 500 });
    }

    const result = await deliverCampaign({
      campaignId: campaign.id,
      subject,
      htmlContent,
      audience: AUDIENCE,
      recipients: uniqueEmails.map((email) => ({ email, profileId: null })),
    });

    return NextResponse.json({
      success: true,
      campaignId: campaign.id,
      ...result,
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
