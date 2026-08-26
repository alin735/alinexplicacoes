import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/server-bookings';
import { requireAdminFromRequest } from '@/lib/server-admin-auth';
import { deliverCampaign, CampaignRecipient } from '@/lib/campaign-delivery';
import { ADMIN_EMAIL, sendEmailWithResendId } from '@/lib/email';
import { buildUnsubscribeHeaders, withUnsubscribeFooter } from '@/lib/email-audiences';
import {
  SUBJECTS_SURVEY_SUBJECT,
  firstName,
  subjectsSurveyEmailHtml,
} from '@/lib/emails/subjects-survey';

export const maxDuration = 300;

/** Lista de espera das Explicações Top. Audiência própria, à parte da newsletter. */
const AUDIENCE = 'exam-waitlist' as const;

type Body = {
  /** Envia só para o email do Alin, para ver o resultado antes do envio real. */
  test?: boolean;
  /** Envia apenas a estes cursos. Vazio significa toda a lista. */
  courses?: string[];
  /** Trava de segurança: o envio real tem de ser pedido explicitamente. */
  confirm?: boolean;
};

function renderFor(recipient: CampaignRecipient) {
  return subjectsSurveyEmailHtml({
    name: firstName(recipient.fullName, recipient.email),
    course: recipient.course || null,
    email: recipient.email,
  });
}

export async function POST(req: NextRequest) {
  try {
    const { adminUserId } = await requireAdminFromRequest(req);
    const body = (await req.json().catch(() => ({}))) as Body;

    if (body.test) {
      const email = ADMIN_EMAIL;
      const html = subjectsSurveyEmailHtml({
        name: 'Alin',
        course: 'Ciências e Tecnologias',
        email,
      });
      await sendEmailWithResendId(
        email,
        SUBJECTS_SURVEY_SUBJECT,
        withUnsubscribeFooter(html, email, AUDIENCE),
        buildUnsubscribeHeaders(email, AUDIENCE),
      );
      return NextResponse.json({ success: true, test: true, email });
    }

    if (!body.confirm) {
      return NextResponse.json(
        { error: 'O envio real precisa de confirmação explícita.' },
        { status: 400 },
      );
    }

    const supabase = getServiceSupabase();
    let query = supabase
      .from('exam_correction_waitlist')
      .select('email, full_name, course')
      .in('status', ['active', 'contacted']);

    if (Array.isArray(body.courses) && body.courses.length > 0) {
      query = query.in('course', body.courses);
    }

    const { data: leads, error: leadsError } = await query;

    if (leadsError) {
      return NextResponse.json({ error: 'Não foi possível carregar a lista de espera.' }, { status: 500 });
    }

    const recipients: CampaignRecipient[] = (leads || [])
      .map((lead) => ({
        email: String(lead.email || '').trim().toLowerCase(),
        fullName: lead.full_name || null,
        course: lead.course || null,
        profileId: null,
      }))
      .filter((lead) => lead.email.length > 0);

    if (recipients.length === 0) {
      return NextResponse.json({ error: 'Não existem destinatários para este envio.' }, { status: 400 });
    }

    const { data: campaign, error: campaignError } = await supabase
      .from('newsletter_campaigns')
      .insert({
        created_by: adminUserId,
        subject: SUBJECTS_SURVEY_SUBJECT,
        // Guarda um exemplo do email, já que cada pessoa recebe o seu.
        html_content: renderFor(recipients[0]),
        recipient_count: recipients.length,
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
      subject: SUBJECTS_SURVEY_SUBJECT,
      htmlContent: renderFor(recipients[0]),
      audience: AUDIENCE,
      recipients,
      renderHtml: renderFor,
    });

    return NextResponse.json({ success: true, campaignId: campaign.id, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao enviar o inquérito.';
    const status = message.includes('Sem autenticação válida.')
      ? 401
      : message.includes('administradores') || message.includes('Sessão inválida')
        ? 403
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
