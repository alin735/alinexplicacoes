import { replaceBrandEmojisWithHtml } from '@/lib/brand-emojis';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'alincmat29@gmail.com';
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'MatemáticaTop <noreply@contacto.matematica.top>';

export { ADMIN_EMAIL };

export async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY não definida no servidor.');
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
  });

  if (!res.ok) {
    const payload = await res.text();
    throw new Error(`Falha no envio de email (${res.status}): ${payload}`);
  }

  return true;
}

export async function sendEmailWithResendId(to: string, subject: string, html: string): Promise<string | null> {
  if (!RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY não definida no servidor.');
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
  });

  const payload = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(
      `Falha no envio de email (${res.status}): ${payload ? JSON.stringify(payload) : 'sem detalhes'}`,
    );
  }

  return typeof payload?.id === 'string' ? payload.id : null;
}

export function lessonCreatedEmailTemplate(
  studentName: string,
  title: string,
  subject: string,
  date: string,
) {
  return replaceBrandEmojisWithHtml(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Helvetica Neue', Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
        .card { background: white; border-radius: 16px; max-width: 520px; margin: 0 auto; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
        .header { background: linear-gradient(135deg, #000000, #2a2a2a); padding: 32px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 22px; }
        .header p { color: rgba(255,255,255,0.7); margin: 8px 0 0; font-size: 14px; }
        .body { padding: 32px; }
        .badge { display: inline-block; background: #e5e5e5; color: #1f1f1f; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 600; margin-bottom: 20px; }
        .info-row { display: flex; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid #f5f5f5; }
        .info-row:last-child { border-bottom: none; }
        .info-label { font-size: 12px; color: #7f8c8d; text-transform: uppercase; letter-spacing: 0.5px; min-width: 80px; }
        .info-value { font-size: 15px; color: #000000; font-weight: 600; }
        .cta { display: block; margin: 28px auto 0; background: linear-gradient(90deg, #111111, #2a2a2a); color: white; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 15px; text-align: center; }
        .footer { padding: 20px 32px; text-align: center; background: #f8fafc; border-top: 1px solid #e8edf2; }
        .footer p { font-size: 12px; color: #95a5a6; margin: 0; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1>MatemáticaTop</h1>
          <p>Nova aula disponível</p>
        </div>
        <div class="body">
          <span class="badge">Nova aula criada</span>
          <p style="color:#000000; font-size:16px; margin:0 0 20px;">Olá, <strong>${studentName}</strong>! Foi publicada uma nova aula para ti.</p>
          <div class="info-row">
            <span class="info-label">Título</span>
            <span class="info-value">${title}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Disciplina</span>
            <span class="info-value">${subject}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Data</span>
            <span class="info-value">${date}</span>
          </div>
          <a href="https://alinexplicacoes.vercel.app/aulas" class="cta" style="color:#ffffff !important; text-decoration:none;">
            <span style="color:#ffffff !important;">Ver aulas</span>
            <span style="color:#ffffff !important;">→</span>
          </a>
        </div>
        <div class="footer">
          <p>Enviado por MatemáticaTop</p>
        </div>
      </div>
    </body>
    </html>
  `);
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

  return replaceBrandEmojisWithHtml(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Helvetica Neue', Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
        .card { background: white; border-radius: 16px; max-width: 520px; margin: 0 auto; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
        .header { background: linear-gradient(135deg, #000000, #2a2a2a); padding: 32px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 22px; }
        .header p { color: rgba(255,255,255,0.7); margin: 8px 0 0; font-size: 14px; }
        .body { padding: 32px; }
        .badge { display: inline-block; background: #e8e8e8; color: #1f1f1f; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 600; margin-bottom: 20px; }
        .info-row { display: flex; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid #f5f5f5; }
        .info-row:last-child { border-bottom: none; }
        .info-label { font-size: 12px; color: #7f8c8d; text-transform: uppercase; letter-spacing: 0.5px; min-width: 80px; }
        .info-value { font-size: 15px; color: #000000; font-weight: 600; }
        .footer { padding: 20px 32px; text-align: center; background: #f8fafc; border-top: 1px solid #e8edf2; }
        .footer p { font-size: 12px; color: #95a5a6; margin: 0; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1>MatemáticaTop</h1>
          <p>Confirmação de marcação</p>
        </div>
        <div class="body">
          <span class="badge">Marcação confirmada</span>
          <p style="color:#000000; font-size:16px; margin:0 0 20px;">${greeting}</p>
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
          <p>Enviado por MatemáticaTop</p>
        </div>
      </div>
    </body>
    </html>
  `);
}

export function inPersonPendingReviewEmailTemplate(
  name: string,
  subject: string,
  date: string,
  timeSlot: string,
) {
  return replaceBrandEmojisWithHtml(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Helvetica Neue', Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
        .card { background: white; border-radius: 16px; max-width: 520px; margin: 0 auto; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
        .header { background: linear-gradient(135deg, #000000, #2a2a2a); padding: 32px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 22px; }
        .header p { color: rgba(255,255,255,0.7); margin: 8px 0 0; font-size: 14px; }
        .body { padding: 32px; }
        .badge { display: inline-block; background: #efefef; color: #1f1f1f; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 600; margin-bottom: 20px; }
        .info-row { display: flex; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid #f5f5f5; }
        .info-row:last-child { border-bottom: none; }
        .info-label { font-size: 12px; color: #7f8c8d; text-transform: uppercase; letter-spacing: 0.5px; min-width: 80px; }
        .info-value { font-size: 15px; color: #000000; font-weight: 600; }
        .footer { padding: 20px 32px; text-align: center; background: #f8fafc; border-top: 1px solid #e8edf2; }
        .footer p { font-size: 12px; color: #95a5a6; margin: 0; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1>MatemáticaTop</h1>
          <p>Marcação registada para validação</p>
        </div>
        <div class="body">
          <span class="badge">A aguardar validação</span>
          <p style="color:#000000; font-size:16px; margin:0 0 20px;">
            Olá, <strong>${name}</strong>! A tua marcação foi registada e será agora avaliada.
          </p>
          <p style="color:#5f6b73; font-size:14px; margin:0 0 20px;">
            A explicação só ficará confirmada após validação do pagamento presencial.
          </p>
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
          <p>Enviado por MatemáticaTop</p>
        </div>
      </div>
    </body>
    </html>
  `);
}

export function paymentReceivedWaitingEmailTemplate(
  name: string,
  subject: string,
  date: string,
  timeSlot: string,
) {
  return replaceBrandEmojisWithHtml(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Helvetica Neue', Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
        .card { background: white; border-radius: 16px; max-width: 520px; margin: 0 auto; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
        .header { background: linear-gradient(135deg, #000000, #2a2a2a); padding: 32px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 22px; }
        .header p { color: rgba(255,255,255,0.7); margin: 8px 0 0; font-size: 14px; }
        .body { padding: 32px; }
        .badge { display: inline-block; background: #ebebeb; color: #1f1f1f; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 600; margin-bottom: 20px; }
        .info-row { display: flex; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid #f5f5f5; }
        .info-row:last-child { border-bottom: none; }
        .info-label { font-size: 12px; color: #7f8c8d; text-transform: uppercase; letter-spacing: 0.5px; min-width: 80px; }
        .info-value { font-size: 15px; color: #000000; font-weight: 600; }
        .footer { padding: 20px 32px; text-align: center; background: #f8fafc; border-top: 1px solid #e8edf2; }
        .footer p { font-size: 12px; color: #95a5a6; margin: 0; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1>MatemáticaTop</h1>
          <p>Pagamento recebido</p>
        </div>
        <div class="body">
          <span class="badge">Pagamento registado</span>
          <p style="color:#000000; font-size:16px; margin:0 0 20px;">
            Olá, <strong>${name}</strong>! O teu pagamento foi recebido com sucesso.
          </p>
          <p style="color:#5f6b73; font-size:14px; margin:0 0 20px;">
            A marcação será confirmada assim que todos os participantes concluírem o pagamento.
          </p>
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
          <p>Enviado por MatemáticaTop</p>
        </div>
      </div>
    </body>
    </html>
  `);
}

export function adminBookingCreatedEmailTemplate(
  studentName: string,
  subject: string,
  date: string,
  timeSlot: string,
  paymentMethod: 'online' | 'in_person',
  bookingMode: 'individual' | 'group',
  groupSize: number,
) {
  const paymentLabel = paymentMethod === 'in_person' ? 'Pagamento presencial' : 'Pagamento online';
  const modeLabel = bookingMode === 'group' ? `Grupo (${groupSize} participantes)` : 'Individual';

  return replaceBrandEmojisWithHtml(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Helvetica Neue', Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
        .card { background: white; border-radius: 16px; max-width: 520px; margin: 0 auto; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
        .header { background: linear-gradient(135deg, #000000, #2a2a2a); padding: 32px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 22px; }
        .header p { color: rgba(255,255,255,0.7); margin: 8px 0 0; font-size: 14px; }
        .body { padding: 32px; }
        .badge { display: inline-block; background: #ededed; color: #1f1f1f; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 600; margin-bottom: 20px; }
        .info-row { display: flex; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid #f5f5f5; }
        .info-row:last-child { border-bottom: none; }
        .info-label { font-size: 12px; color: #7f8c8d; text-transform: uppercase; letter-spacing: 0.5px; min-width: 120px; }
        .info-value { font-size: 15px; color: #000000; font-weight: 600; }
        .footer { padding: 20px 32px; text-align: center; background: #f8fafc; border-top: 1px solid #e8edf2; }
        .footer p { font-size: 12px; color: #95a5a6; margin: 0; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1>Nova marcação</h1>
          <p>Notificação de administrador</p>
        </div>
        <div class="body">
          <span class="badge">Nova marcação efetuada</span>
          <p style="color:#000000; font-size:16px; margin:0 0 20px;">
            O aluno <strong>${studentName}</strong> efetuou uma nova marcação.
          </p>
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
          <div class="info-row">
            <span class="info-label">Tipo de aula</span>
            <span class="info-value">${modeLabel}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Pagamento</span>
            <span class="info-value">${paymentLabel}</span>
          </div>
        </div>
        <div class="footer">
          <p>Enviado por MatemáticaTop</p>
        </div>
      </div>
    </body>
    </html>
  `);
}
