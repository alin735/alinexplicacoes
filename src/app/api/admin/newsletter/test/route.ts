import { NextRequest, NextResponse } from 'next/server';
import { requireAdminFromRequest } from '@/lib/server-admin-auth';
import { sendEmailWithResendId } from '@/lib/email';

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

    await sendEmailWithResendId(TEST_NEWSLETTER_EMAIL, subject, htmlContent);

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
