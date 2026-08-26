import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/server-bookings';
import { parseUnsubscribeToken } from '@/lib/email-audiences';

export const dynamic = 'force-dynamic';

function readToken(req: NextRequest) {
  return (new URL(req.url).searchParams.get('token') || '').trim();
}

/**
 * O link visível no email só traz o utilizador até à página de confirmação.
 * Os anti-vírus e os pré-carregadores de links seguem os GET sozinhos, e sem
 * este passo cancelavam a subscrição de quem nem sequer abriu o email.
 */
export async function GET(req: NextRequest) {
  const token = readToken(req);
  const target = new URL('/cancelar-subscricao', req.nextUrl.origin);
  target.searchParams.set('token', token);
  return NextResponse.redirect(target, 302);
}

/**
 * Cancelamento efetivo. Serve tanto o botão da página de confirmação como o
 * "cancelar subscrição" nativo do Gmail e do Outlook (List-Unsubscribe-Post).
 */
export async function POST(req: NextRequest) {
  let token = readToken(req);

  if (!token) {
    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const body = (await req.json().catch(() => ({}))) as { token?: string };
      token = String(body.token || '').trim();
    } else {
      const form = await req.formData().catch(() => null);
      token = String(form?.get('token') || '').trim();
    }
  }

  const parsed = token ? parseUnsubscribeToken(token) : null;
  if (!parsed) {
    return NextResponse.json({ error: 'Link de cancelamento inválido ou expirado.' }, { status: 400 });
  }

  const { email, audience } = parsed;
  const supabase = getServiceSupabase();

  const { error } = await supabase
    .from('email_optouts')
    .upsert({ email, audience, source: 'email-link' }, { onConflict: 'email,audience' });

  if (error) {
    return NextResponse.json({ error: 'Não foi possível cancelar a subscrição.' }, { status: 500 });
  }

  // Na newsletter, refletir também nas tabelas que alimentam a audiência,
  // para os totais no admin não mostrarem gente que já saiu.
  if (audience === 'newsletter') {
    await supabase
      .from('newsletter_contacts')
      .update({ status: 'unsubscribed' })
      .ilike('email', email);
    await supabase
      .from('profiles')
      .update({ newsletter_opt_in: false })
      .ilike('email', email);
  }

  return NextResponse.json({ success: true, email, audience });
}
