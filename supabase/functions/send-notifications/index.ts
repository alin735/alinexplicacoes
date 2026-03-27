import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const SITE_URL = Deno.env.get('SITE_URL') || Deno.env.get('NEXT_PUBLIC_SITE_URL') || 'https://matematica.top';
const DEFAULT_FROM_EMAIL = 'MatemáticaTop <noreply@contacto.matematica.top>';
const ADMIN_EMAIL = 'alincmat29@gmail.com';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

function normalizeBaseUrl(url: string) {
  return url.replace(/\/+$/, '');
}

function buildFromEmail(rawFromEmail: string | undefined) {
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

const FROM_EMAIL = buildFromEmail(Deno.env.get('RESEND_FROM_EMAIL'));
const BRAND_LOGO_URL = `${normalizeBaseUrl(SITE_URL)}/logo.png`;

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

async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    }),
  });
  return res.ok;
}

function emailTemplate(studentName: string, subject: string, date: string, timeSlot: string, when: string, isAdmin: boolean) {
  const greeting = isAdmin
    ? `Tens uma explicação agendada com <strong>${studentName}</strong>.`
    : `Olá, <strong>${studentName}</strong>! Tens uma explicação agendada.`;
  return `
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
        .cta { display: block; margin: 28px auto 0; background: linear-gradient(90deg, #111111, #2a2a2a); color: white; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 15px; text-align: center; }
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
          <span class="when-badge">${when}</span>
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
  `;
}

function parseTimeSegment(segment: string) {
  const clean = segment.trim();
  const match = clean.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = Number(match[3] || '0');

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    Number.isNaN(seconds) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59 ||
    seconds < 0 ||
    seconds > 59
  ) {
    return null;
  }

  return { hours, minutes, seconds };
}

function getBookingDateTime(date: string, timeSlot: string): Date | null {
  const startTimeRaw = timeSlot.split('-')[0]?.trim();
  if (!startTimeRaw) return null;

  const parsed = parseTimeSegment(startTimeRaw);
  if (!parsed) return null;

  const bookingTime = new Date(`${date}T00:00:00`);
  if (Number.isNaN(bookingTime.getTime())) return null;

  bookingTime.setHours(parsed.hours, parsed.minutes, parsed.seconds, 0);
  return bookingTime;
}

serve(async () => {
  const now = new Date();

  const windows = [
    { label: '1 dia antes', minMinutes: 24 * 60 - 5, maxMinutes: 24 * 60 + 5, type: 'day' },
    { label: '1 hora antes', minMinutes: 55, maxMinutes: 65, type: 'hour' },
    { label: '15 minutos antes', minMinutes: 10, maxMinutes: 20, type: 'quarter' },
  ];

  let sent = 0;

  // Get all confirmed bookings for upcoming days
  const todayStr = now.toISOString().split('T')[0];
  const twoDaysLater = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const { data: bookings } = await supabase
    .from('bookings')
    .select('*, profiles!bookings_student_id_fkey(full_name, username)')
    .eq('status', 'confirmed')
    .gte('date', todayStr)
    .lte('date', twoDaysLater);

  if (!bookings) {
    return new Response(JSON.stringify({ success: true, sent: 0 }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  for (const booking of bookings) {
    const bookingTime = getBookingDateTime(booking.date, booking.time_slot);
    if (!bookingTime) continue;

    const diffMinutes = (bookingTime.getTime() - now.getTime()) / (60 * 1000);
    if (!Number.isFinite(diffMinutes)) continue;

    for (const window of windows) {
      if (diffMinutes < window.minMinutes || diffMinutes > window.maxMinutes) continue;

      // The 1-day reminder only applies to lessons booked before that checkpoint.
      if (window.type === 'day') {
        const bookingCreatedAt = booking.created_at ? new Date(booking.created_at) : null;
        const oneDayBeforeLesson = new Date(bookingTime.getTime() - 24 * 60 * 60 * 1000);
        if (!bookingCreatedAt || bookingCreatedAt > oneDayBeforeLesson) {
          continue;
        }
      }

      // Check if notification already sent
      const { data: existing } = await supabase
        .from('notification_log')
        .select('id')
        .eq('booking_id', booking.id)
        .eq('type', window.type)
        .single();

      if (existing) continue;

      // Get student email
      const { data: userData } = await supabase.auth.admin.getUserById(booking.student_id);
      if (!userData?.user?.email) continue;

      const studentName = booking.profiles?.full_name || booking.profiles?.username || 'Aluno';

      // Send to student
      const studentHtml = emailTemplate(studentName, booking.subject, booking.date, booking.time_slot, window.label, false);
      const studentOk = await sendEmail(userData.user.email, `Lembrete: explicação de ${booking.subject} — ${window.label}`, studentHtml);

      // Send to admin
      const adminHtml = emailTemplate(studentName, booking.subject, booking.date, booking.time_slot, window.label, true);
      await sendEmail(ADMIN_EMAIL, `Lembrete: explicação com ${studentName} — ${window.label}`, adminHtml);

      if (studentOk) {
        await supabase.from('notification_log').insert({
          booking_id: booking.id,
          type: window.type,
          sent_at: now.toISOString(),
        });
        sent++;
      }
    }
  }

  return new Response(JSON.stringify({ success: true, sent }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
