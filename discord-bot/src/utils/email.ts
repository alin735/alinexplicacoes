import { config } from '../config';

// Send magic link email using Resend API via fetch
export async function sendMagicLinkEmail(email: string, token: string): Promise<boolean> {
  const htmlContent = `
<div style="font-family:Arial,sans-serif;background:#f5f5f5;padding:24px;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e5e5;">
    <div style="background:#111111;padding:28px 24px;text-align:center;">
      <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;">MatemáticaTop</h1>
      <p style="margin:10px 0 0;color:#d4d4d4;font-size:14px;">Login no Discord</p>
    </div>
    <div style="padding:32px 24px;color:#111111;">
      <h2 style="margin:0 0 16px;font-size:28px;line-height:1.2;">Confirma o teu login</h2>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.7;">
        Recebeste este email porque solicitaste fazer login no bot Discord da MatemáticaTop.
      </p>
      <p style="margin:0 0 24px;font-size:16px;line-height:1.7;">
        Volta ao Discord e clica no botão "Já verifiquei o email" para completar o login.
      </p>
      <p style="margin:24px 0 0;font-size:14px;line-height:1.7;color:#666666;">
        Se não solicitaste este login, podes ignorar este email.
      </p>
    </div>
    <div style="padding:20px 24px;background:#fafafa;border-top:1px solid #eeeeee;text-align:center;color:#8a8a8a;font-size:12px;">
      Enviado por MatemáticaTop
    </div>
  </div>
</div>
  `;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: config.resendFromEmail,
        to: email,
        subject: 'Login Discord - MatemáticaTop',
        html: htmlContent,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Failed to send email:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}
