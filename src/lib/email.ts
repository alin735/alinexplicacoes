const RESEND_API_KEY = process.env.RESEND_API_KEY!;
const ADMIN_EMAIL = 'alincmat29@gmail.com';
const FROM_EMAIL = 'AlinMat <notificacoes@alinmat.pt>';

export { ADMIN_EMAIL };

export async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
  });
  return res.ok;
}

export function confirmationEmailTemplate(
  name: string,
  subject: string,
  date: string,
  timeSlot: string,
  isAdmin: boolean
) {
  const greeting = isAdmin
    ? `Nova marcação confirmada de <strong>${name}</strong>.`
    : `Olá, <strong>${name}</strong>! A tua marcação foi confirmada com sucesso.`;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Helvetica Neue', Arial, sans-serif; background: #f0f4f8; margin: 0; padding: 20px; }
        .card { background: white; border-radius: 16px; max-width: 520px; margin: 0 auto; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
        .header { background: linear-gradient(135deg, #0d2f4a, #2980b9); padding: 32px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 22px; }
        .header p { color: rgba(255,255,255,0.7); margin: 8px 0 0; font-size: 14px; }
        .body { padding: 32px; }
        .badge { display: inline-block; background: #d4edda; color: #155724; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 600; margin-bottom: 20px; }
        .info-row { display: flex; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid #f0f4f8; }
        .info-row:last-child { border-bottom: none; }
        .info-label { font-size: 12px; color: #7f8c8d; text-transform: uppercase; letter-spacing: 0.5px; min-width: 80px; }
        .info-value { font-size: 15px; color: #0d2f4a; font-weight: 600; }
        .footer { padding: 20px 32px; text-align: center; background: #f8fafc; border-top: 1px solid #e8edf2; }
        .footer p { font-size: 12px; color: #95a5a6; margin: 0; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1>📚 AlinMat — Explicações</h1>
          <p>Confirmação de marcação</p>
        </div>
        <div class="body">
          <span class="badge">✅ Marcação confirmada</span>
          <p style="color:#0d2f4a; font-size:16px; margin:0 0 20px;">${greeting}</p>
          <div class="info-row">
            <span class="info-label">Disciplina</span>
            <span class="info-value">${subject}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Data</span>
            <span class="info-value">${date}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Horário</span>
            <span class="info-value">${timeSlot}</span>
          </div>
        </div>
        <div class="footer">
          <p>Enviado por AlinMat · Explicações com o Alin</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
