import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/server-bookings';
import { requireAdminFromRequest } from '@/lib/server-admin-auth';
import { deliverCampaign, loadOptedOutEmails } from '@/lib/campaign-delivery';

export const maxDuration = 300;

type SendNewsletterBody = {
  subject?: string;
  htmlContent?: string;
};

/**
 * Newsletter normal. A audiência são as contas com opt-in e os contactos do
 * rodapé do site. As listas de espera são audiências à parte e nunca entram
 * neste envio.
 */
const AUDIENCE = 'newsletter' as const;

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

    const { data: optedContacts, error: contactsError } = await supabase
      .from('newsletter_contacts')
      .select('id, email')
      .eq('status', 'active');

    if (contactsError) {
      return NextResponse.json({ error: 'Não foi possível carregar os subscritores externos.' }, { status: 500 });
    }

    const uniqueByEmail = new Map<string, { profileId: string | null; email: string }>();

    (optedProfiles || []).forEach((profile) => {
      const email = String(profile.email || '').trim();
      if (!email) return;
      const key = email.toLowerCase();
      if (!uniqueByEmail.has(key)) {
        uniqueByEmail.set(key, { profileId: profile.id as string, email });
      }
    });

    (optedContacts || []).forEach((contact) => {
      const email = String(contact.email || '').trim();
      if (!email) return;
      const key = email.toLowerCase();
      if (!uniqueByEmail.has(key)) {
        uniqueByEmail.set(key, { profileId: null, email });
      }
    });

    const optedOut = await loadOptedOutEmails(AUDIENCE);
    optedOut.forEach((email) => uniqueByEmail.delete(email));

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
      recipients,
    });

    return NextResponse.json({
      success: true,
      campaignId: campaign.id,
      ...result,
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
