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
const LESSONS_TIME_ZONE = 'Europe/Lisbon';

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

function getReminderCopy(reminderType: 'day' | 'hour' | 'quarter', studentName: string, isAdmin: boolean) {
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

function getReminderSubject(
  reminderType: 'day' | 'hour' | 'quarter',
  subject: string,
  isAdmin: boolean,
  studentName?: string,
) {
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

function emailTemplate(
  studentName: string,
  subject: string,
  date: string,
  timeSlot: string,
  reminderType: 'day' | 'hour' | 'quarter',
  isAdmin: boolean,
) {
  const reminderCopy = getReminderCopy(reminderType, studentName, isAdmin);
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

function getTimeZoneOffsetMs(date: Date, timeZone: string): number {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });

  const parts = formatter.formatToParts(date).reduce<Record<string, string>>((acc, part) => {
    if (part.type !== 'literal') {
      acc[part.type] = part.value;
    }
    return acc;
  }, {});

  const zonedUtcTime = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );

  return zonedUtcTime - date.getTime();
}

function getDateValueInTimeZone(date: Date, timeZone: string): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  return formatter.format(date);
}

function getBookingDateTime(date: string, timeSlot: string): Date | null {
  const startTimeRaw = timeSlot.split('-')[0]?.trim();
  if (!startTimeRaw) return null;

  const parsed = parseTimeSegment(startTimeRaw);
  if (!parsed) return null;

  const [year, month, day] = date.split('-').map(Number);
  const utcGuess = new Date(Date.UTC(year, month - 1, day, parsed.hours, parsed.minutes, parsed.seconds));
  const offset = getTimeZoneOffsetMs(utcGuess, LESSONS_TIME_ZONE);
  const bookingTime = new Date(utcGuess.getTime() - offset);
  return Number.isNaN(bookingTime.getTime()) ? null : bookingTime;
}

serve(async () => {
  const now = new Date();

  const windows = [
    { minMinutes: 24 * 60 - 5, maxMinutes: 24 * 60 + 5, type: 'day' as const },
    { minMinutes: 55, maxMinutes: 65, type: 'hour' as const },
    { minMinutes: 10, maxMinutes: 20, type: 'quarter' as const },
  ];

  let sent = 0;

  // Get all confirmed bookings for upcoming days
  const todayStr = getDateValueInTimeZone(now, LESSONS_TIME_ZONE);
  const twoDaysLater = getDateValueInTimeZone(
    new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
    LESSONS_TIME_ZONE,
  );

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
      const studentHtml = emailTemplate(studentName, booking.subject, booking.date, booking.time_slot, window.type, false);
      const studentOk = await sendEmail(
        userData.user.email,
        getReminderSubject(window.type, booking.subject, false),
        studentHtml,
      );

      // Send to admin
      const adminHtml = emailTemplate(studentName, booking.subject, booking.date, booking.time_slot, window.type, true);
      await sendEmail(
        ADMIN_EMAIL,
        getReminderSubject(window.type, booking.subject, true, studentName),
        adminHtml,
      );

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
