import { NextRequest, NextResponse } from 'next/server';
import { requireAdminFromRequest } from '@/lib/server-admin-auth';
import { sendEmailWithResendId } from '@/lib/email';
import { buildUnsubscribeHeaders, withUnsubscribeFooter } from '@/lib/email-audiences';

type SendNewsletterBody = {
  subject?: string;
  htmlContent?: string;
};

const TEST_NEWSLETTER_EMAIL = 'alincmat29@gmail.com';

export async function POST(req: NextRequest) {
  try {
    await requireAdminFromRequest(req);
    const body = (await req.json()) as SendNewsletterBody;
    const subject = body.subject?.trim();
    const htmlContent = body.htmlContent?.trim();

    if (!subject || !htmlContent) {
      return NextResponse.json({ error: 'Assunto e conteúdo são obrigatórios.' }, { status: 400 });
    }

    // O teste leva o mesmo rodapé e cabeçalhos do envio real, para veres
    // exatamente o email que os subscritores vão receber.
    await sendEmailWithResendId(
      TEST_NEWSLETTER_EMAIL,
      subject,
      withUnsubscribeFooter(htmlContent, TEST_NEWSLETTER_EMAIL, 'newsletter'),
      buildUnsubscribeHeaders(TEST_NEWSLETTER_EMAIL, 'newsletter'),
    );

    return NextResponse.json({
      success: true,
      email: TEST_NEWSLETTER_EMAIL,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao enviar teste de newsletter.';
    const status = message.includes('Sem autenticação válida.')
      ? 401
      : message.includes('administradores') || message.includes('Sessão inválida')
        ? 403
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
