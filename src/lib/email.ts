import { replaceBrandEmojisWithHtml } from '@/lib/brand-emojis';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'alincmat29@gmail.com';
const DEFAULT_FROM_EMAIL = 'MatemáticaTop <noreply@contacto.matematica.top>';

function normalizeBaseUrl(url?: string) {
  return (url || 'https://matematica.top').replace(/\/+$/, '');
}

function buildFromEmail(rawFromEmail?: string) {
  const source = (rawFromEmail || DEFAULT_FROM_EMAIL).trim();
  const addressMatch = source.match(/<([^>]+)>/);
  if (addressMatch?.[1]) {
    return `MatemáticaTop <${addressMatch[1].trim()}>`;
  }

  if (source.includes('@')) {
    return `MatemáticaTop <${source}>`;
  }

  return DEFAULT_FROM_EMAIL;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatTimeSegment(segment: string) {
  const clean = segment.trim();
  const match = clean.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (!match) return clean;

  const hours = match[1].padStart(2, '0');
  const minutes = match[2];
  return `${hours}:${minutes}`;
}

function formatTimeSlotDisplay(timeSlot: string) {
  const [startRaw = '', endRaw = ''] = timeSlot.split('-');
  const start = formatTimeSegment(startRaw);
  const end = formatTimeSegment(endRaw);

  if (!start && !end) return timeSlot;
  if (!end) return start;
  return `${start} - ${end}`;
}

const FROM_EMAIL = buildFromEmail(process.env.RESEND_FROM_EMAIL);
const BRAND_LOGO_URL = `${normalizeBaseUrl(process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL)}/logo.png`;
const DISCORD_URL = 'https://discord.gg/7eK2QAsp23';

function renderBrandHeader(subtitle: string) {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto;">
      <tr>
        <td style="padding-right:10px;vertical-align:middle;">
          <img src="${BRAND_LOGO_URL}" alt="MatemáticaTop" width="28" height="28" style="display:block;width:28px;height:28px;object-fit:contain;" />
        </td>
        <td style="vertical-align:middle;">
          <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;line-height:1.2;">MatemáticaTop</h1>
        </td>
      </tr>
    </table>
    <p>${subtitle}</p>
  `;
}

function renderDiscordContactBlock() {
  return `
    <div style="margin-top:20px;padding:18px;border:1px solid #e7eaee;border-radius:14px;background:#fafafa;">
      <p style="margin:0 0 10px;color:#000000;font-size:14px;line-height:1.6;">
        Entra no Discord para poderes trocar mais informações com o Alin.
      </p>
      <a
        href="${DISCORD_URL}"
        style="display:inline-block;background:#000000;color:#ffffff !important;text-decoration:none;padding:12px 18px;border-radius:10px;font-size:14px;font-weight:700;"
      >
        Entrar no Discord
      </a>
    </div>
  `;
}

export { ADMIN_EMAIL };

type ReminderType = 'day' | 'hour' | 'quarter';

function getReminderCopy(reminderType: ReminderType, studentName: string, isAdmin: boolean) {
  switch (reminderType) {
    case 'day':
      return {
        badge: '1 dia antes',
        greeting: isAdmin
          ? `A aula com <strong>${studentName}</strong> está agendada para amanhã.`
          : `Olá, <strong>${studentName}</strong>! Lembramos que tens uma aula amanhã.`,
      };
    case 'hour':
      return {
        badge: '1 hora antes',
        greeting: isAdmin
          ? `A aula com <strong>${studentName}</strong> irá começar daqui a 1 hora.`
          : `Olá, <strong>${studentName}</strong>! Lembramos que a tua aula irá começar daqui a 1 hora.`,
      };
    case 'quarter':
      return {
        badge: '15 minutos antes',
        greeting: isAdmin
          ? `A aula com <strong>${studentName}</strong> irá começar daqui a 15 minutos.`
          : `Olá, <strong>${studentName}</strong>! Lembramos que a tua aula irá começar daqui a 15 minutos.`,
      };
  }
}

export function getReminderSubject(reminderType: ReminderType, subject: string, isAdmin: boolean, studentName?: string) {
  switch (reminderType) {
    case 'day':
      return isAdmin
        ? `Lembrete: explicação com ${studentName || 'aluno'} é amanhã`
        : `Lembrete: a tua explicação de ${subject} é amanhã`;
    case 'hour':
      return isAdmin
        ? `Lembrete: explicação com ${studentName || 'aluno'} começa dentro de 1 hora`
        : `Lembrete: a tua explicação de ${subject} começa dentro de 1 hora`;
    case 'quarter':
      return isAdmin
        ? `Lembrete: explicação com ${studentName || 'aluno'} começa dentro de 15 minutos`
        : `Lembrete: a tua explicação de ${subject} começa dentro de 15 minutos`;
  }
}

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
            ${renderBrandHeader('Nova aula disponível')}
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
  const formattedTimeSlot = formatTimeSlotDisplay(timeSlot);
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
            ${renderBrandHeader('Confirmação de marcação')}
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
            <span class="info-value">${formattedTimeSlot}</span>
          </div>
          ${isAdmin ? '' : renderDiscordContactBlock()}
        </div>
        <div class="footer">
          <p>Enviado por MatemáticaTop</p>
        </div>
      </div>
    </body>
    </html>
  `);
}

export function bookingRequestReceivedEmailTemplate(
  name: string,
  subject: string,
  date: string,
  timeSlot: string,
  paymentMethod: 'online' | 'in_person',
) {
  const formattedTimeSlot = formatTimeSlotDisplay(timeSlot);
  const extraText =
    paymentMethod === 'online'
      ? 'Completa o pagamento para confirmares a tua marcação.'
      : 'O pedido será agora revisto manualmente pelo Alin.';

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
          ${renderBrandHeader('Pedido de marcação recebido')}
        </div>
        <div class="body">
          <span class="badge">Pedido registado</span>
          <p style="color:#000000; font-size:16px; margin:0 0 16px;">
            Olá, <strong>${name}</strong>. O teu pedido de marcação foi registado com sucesso.
          </p>
          <p style="color:#5f6b73; font-size:14px; margin:0 0 20px;">
            ${extraText}
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
            <span class="info-value">${formattedTimeSlot}</span>
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

export function bookingReminderEmailTemplate(
  studentName: string,
  subject: string,
  date: string,
  timeSlot: string,
  reminderType: ReminderType,
  isAdmin: boolean,
) {
  const formattedTimeSlot = formatTimeSlotDisplay(timeSlot);
  const reminderCopy = getReminderCopy(reminderType, studentName, isAdmin);

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
        .when-badge { display: inline-block; background: #efefef; color: #1f1f1f; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 600; margin-bottom: 20px; }
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
          ${renderBrandHeader('Lembrete de aula')}
        </div>
        <div class="body">
          <span class="when-badge">${reminderCopy.badge}</span>
          <p style="color:#000000; font-size:16px; margin:0 0 20px;">${reminderCopy.greeting}</p>
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
            <span class="info-value">${formattedTimeSlot}</span>
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
  const formattedTimeSlot = formatTimeSlotDisplay(timeSlot);
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
            ${renderBrandHeader('Marcação registada para validação')}
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
            <span class="info-value">${formattedTimeSlot}</span>
          </div>
          ${renderDiscordContactBlock()}
        </div>
        <div class="footer">
          <p>Enviado por MatemáticaTop</p>
        </div>
      </div>
    </body>
    </html>
  `);
}

export function chatReplyNotificationEmailTemplate(
  studentName: string,
  messageText: string,
) {
  const siteUrl = normalizeBaseUrl(process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL);
  const safeStudentName = escapeHtml(studentName);
  const sanitizedPreview = escapeHtml(
    messageText
      .trim()
      .replace(/\s+/g, ' ')
      .slice(0, 220),
  );

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
        .preview { margin-top: 18px; padding: 16px; border: 1px solid #eceff3; border-radius: 14px; background: #fafafa; color: #000000; font-size: 14px; line-height: 1.7; }
        .cta { display: inline-block; margin-top: 24px; background: #000000; color: #ffffff !important; text-decoration: none; padding: 12px 18px; border-radius: 10px; font-size: 14px; font-weight: 700; }
        .footer { padding: 20px 32px; text-align: center; background: #f8fafc; border-top: 1px solid #e8edf2; }
        .footer p { font-size: 12px; color: #95a5a6; margin: 0; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          ${renderBrandHeader('Nova mensagem')}
        </div>
        <div class="body">
          <span class="badge">Nova mensagem do Alin</span>
          <p style="color:#000000; font-size:16px; margin:0;">
            Olá, <strong>${safeStudentName}</strong>. O Alin respondeu-te no chat do site.
          </p>
          <div class="preview">
            ${sanitizedPreview}
          </div>
          <a href="${siteUrl}" class="cta">Abrir chat</a>
        </div>
        <div class="footer">
          <p>Enviado por MatemáticaTop</p>
        </div>
      </div>
    </body>
    </html>
  `);
}

export function adminChatMessageNotificationEmailTemplate(
  studentName: string,
  studentEmail: string,
  messageText: string,
) {
  const siteUrl = normalizeBaseUrl(process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL);
  const safeStudentName = escapeHtml(studentName);
  const safeStudentEmail = escapeHtml(studentEmail);
  const sanitizedPreview = escapeHtml(
    messageText
      .trim()
      .replace(/\s+/g, ' ')
      .slice(0, 260),
  );

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
        .info { margin-top: 16px; color: #000000; font-size: 14px; line-height: 1.7; }
        .preview { margin-top: 18px; padding: 16px; border: 1px solid #eceff3; border-radius: 14px; background: #fafafa; color: #000000; font-size: 14px; line-height: 1.7; }
        .cta { display: inline-block; margin-top: 24px; background: #000000; color: #ffffff !important; text-decoration: none; padding: 12px 18px; border-radius: 10px; font-size: 14px; font-weight: 700; }
        .footer { padding: 20px 32px; text-align: center; background: #f8fafc; border-top: 1px solid #e8edf2; }
        .footer p { font-size: 12px; color: #95a5a6; margin: 0; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          ${renderBrandHeader('Nova mensagem no chat')}
        </div>
        <div class="body">
          <span class="badge">Nova mensagem de aluno</span>
          <p style="color:#000000; font-size:16px; margin:0;">
            Recebeste uma nova mensagem no chat do site.
          </p>
          <div class="info">
            <strong>Nome:</strong> ${safeStudentName}<br />
            <strong>Email:</strong> ${safeStudentEmail}
          </div>
          <div class="preview">
            ${sanitizedPreview}
          </div>
          <a href="${siteUrl}/admin" class="cta">Abrir painel admin</a>
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
  const formattedTimeSlot = formatTimeSlotDisplay(timeSlot);
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
            ${renderBrandHeader('Pagamento recebido')}
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
            <span class="info-value">${formattedTimeSlot}</span>
          </div>
          ${renderDiscordContactBlock()}
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
  const formattedTimeSlot = formatTimeSlotDisplay(timeSlot);
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
            <span class="info-value">${formattedTimeSlot}</span>
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
