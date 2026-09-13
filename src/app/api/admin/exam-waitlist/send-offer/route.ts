import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/server-bookings';
import { requireAdminFromRequest } from '@/lib/server-admin-auth';
import { deliverCampaign, CampaignRecipient } from '@/lib/campaign-delivery';
import { ADMIN_EMAIL, sendEmailWithResendId } from '@/lib/email';
import { buildUnsubscribeHeaders, withUnsubscribeFooter } from '@/lib/email-audiences';
import { OFERTA_ASSUNTO, ofertaAssunto, ofertaEmailHtml } from '@/lib/emails/explicador-disponivel';

export const maxDuration = 300;

/** Lista de espera das Explicações Top. Audiência própria, à parte da newsletter. */
const AUDIENCE = 'exam-waitlist' as const;

type Body = {
  /** Envia só para o email do Alin, para ver o resultado antes do envio real. */
  test?: boolean;
  /** Trava de segurança: o envio real tem de ser pedido explicitamente. */
  confirm?: boolean;
  /** Teto de destinatários neste envio, útil com o limite diário do Resend. */
  limite?: number;
};

/** Emails que o motor de envio descarta por não serem enviáveis. */
function emailEnviavel(email: string) {
  return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email) && !/@gmail\.(con|cm|co)$/i.test(email);
}

/** Quem já recebeu algum email desta audiência, em qualquer campanha anterior. */
async function emailsJaContactados(): Promise<Set<string>> {
  const supabase = getServiceSupabase();

  const { data: campanhas } = await supabase
    .from('newsletter_campaigns')
    .select('id')
    .eq('audience', AUDIENCE);

  const ids = (campanhas || []).map((c) => c.id as string);
  if (ids.length === 0) return new Set();

  // Paginado de propósito: o cliente devolve no máximo 1000 linhas por consulta,
  // e a partir de umas campanhas o histórico passa disso. Sem isto, a lista de
  // "já contactados" vinha truncada e havia gente a receber o email duas vezes.
  const PAGINA = 1000;
  const contactados = new Set<string>();

  for (let inicio = 0; ; inicio += PAGINA) {
    const { data: envios, error } = await supabase
      .from('newsletter_sends')
      .select('email')
      .in('campaign_id', ids)
      .eq('status', 'sent')
      .range(inicio, inicio + PAGINA - 1);

    if (error) {
      throw new Error('Não foi possível apurar quem já recebeu o email.');
    }

    (envios || []).forEach((e) => contactados.add(String(e.email || '').trim().toLowerCase()));
    if (!envios || envios.length < PAGINA) break;
  }

  return contactados;
}

function renderPara(recipient: CampaignRecipient & { source?: string | null }) {
  return ofertaEmailHtml({
    fullName: recipient.fullName ?? null,
    email: recipient.email,
    source: recipient.source ?? null,
    course: recipient.course ?? null,
  });
}

export async function POST(req: NextRequest) {
  try {
    const { adminUserId } = await requireAdminFromRequest(req);
    const body = (await req.json().catch(() => ({}))) as Body;

    if (body.test) {
      const email = ADMIN_EMAIL;
      const html = ofertaEmailHtml({
        fullName: 'Alin',
        email,
        source: 'correcao-prova-matematica-9-ano-2026',
        course: 'Ciências e Tecnologias',
      });
      await sendEmailWithResendId(
        email,
        ofertaAssunto('Alin'),
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
    const { data: leads, error: leadsError } = await supabase
      .from('exam_correction_waitlist')
      .select('email, full_name, phone, source, course')
      .in('status', ['active', 'contacted']);

    if (leadsError) {
      return NextResponse.json({ error: 'Não foi possível carregar a lista de espera.' }, { status: 500 });
    }

    const jaContactados = await emailsJaContactados();

    // Só quem nunca recebeu email desta lista. Quem tem telemóvel já foi
    // contactado por WhatsApp, por isso fica de fora deste envio.
    const recipients: Array<CampaignRecipient & { source: string | null }> = (leads || [])
      .map((lead) => ({
        email: String(lead.email || '').trim().toLowerCase(),
        fullName: lead.full_name || null,
        course: lead.course || null,
        source: lead.source || null,
        profileId: null,
        telefone: String(lead.phone || '').trim(),
      }))
      .filter((lead) => lead.email.length > 0)
      .filter((lead) => !lead.telefone)
      .filter((lead) => !jaContactados.has(lead.email))
      .map(({ telefone, ...resto }) => resto);

    const alvo =
      typeof body.limite === 'number' && body.limite > 0
        ? recipients.slice(0, body.limite)
        : recipients;

    if (alvo.length === 0) {
      return NextResponse.json({ error: 'Não há ninguém por contactar.' }, { status: 400 });
    }

    const { data: campaign, error: campaignError } = await supabase
      .from('newsletter_campaigns')
      .insert({
        created_by: adminUserId,
        subject: OFERTA_ASSUNTO,
        // Guarda um exemplo, já que cada pessoa recebe o seu.
        html_content: renderPara(alvo[0]),
        recipient_count: alvo.length,
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
      subject: OFERTA_ASSUNTO,
      htmlContent: renderPara(alvo[0]),
      audience: AUDIENCE,
      recipients: alvo,
      renderHtml: (r) => renderPara(r as CampaignRecipient & { source?: string | null }),
      renderSubject: (r) => ofertaAssunto(r.fullName),
    });

    return NextResponse.json({
      success: true,
      campaignId: campaign.id,
      porContactar: recipients.length,
      ...result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao enviar a oferta.';
    const status = message.includes('Sem autenticação válida.')
      ? 401
      : message.includes('administradores') || message.includes('Sessão inválida')
        ? 403
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

/** Quantas pessoas faltam contactar por email, para o painel mostrar. */
export async function GET(req: NextRequest) {
  try {
    await requireAdminFromRequest(req);
    const supabase = getServiceSupabase();

    const { data: leads } = await supabase
      .from('exam_correction_waitlist')
      .select('email, phone')
      .in('status', ['active', 'contacted']);

    const jaContactados = await emailsJaContactados();
    const porContactar = (leads || []).filter((lead) => {
      const email = String(lead.email || '').trim().toLowerCase();
      const telefone = String(lead.phone || '').trim();
      return email.length > 0 && emailEnviavel(email) && !telefone && !jaContactados.has(email);
    }).length;

    return NextResponse.json({ porContactar });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao contar destinatários.';
    const status = message.includes('Sem autenticação válida.')
      ? 401
      : message.includes('administradores') || message.includes('Sessão inválida')
        ? 403
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
