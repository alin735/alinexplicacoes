import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ADMIN_EMAIL = 'alincmat29@gmail.com';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'AlinMat <notificacoes@alinmat.pt>',
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
        body { font-family: 'Helvetica Neue', Arial, sans-serif; background: #f0f4f8; margin: 0; padding: 20px; }
        .card { background: white; border-radius: 16px; max-width: 520px; margin: 0 auto; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
        .header { background: linear-gradient(135deg, #0d2f4a, #2980b9); padding: 32px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 22px; }
        .header p { color: rgba(255,255,255,0.7); margin: 8px 0 0; font-size: 14px; }
        .body { padding: 32px; }
        .when-badge { display: inline-block; background: #fff3cd; color: #856404; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 600; margin-bottom: 20px; }
        .info-row { display: flex; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid #f0f4f8; }
        .info-row:last-child { border-bottom: none; }
        .info-label { font-size: 12px; color: #7f8c8d; text-transform: uppercase; letter-spacing: 0.5px; min-width: 80px; }
        .info-value { font-size: 15px; color: #0d2f4a; font-weight: 600; }
        .cta { display: block; margin: 28px auto 0; background: linear-gradient(90deg, #1a5276, #2980b9); color: white; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 15px; text-align: center; }
        .footer { padding: 20px 32px; text-align: center; background: #f8fafc; border-top: 1px solid #e8edf2; }
        .footer p { font-size: 12px; color: #95a5a6; margin: 0; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1>📚 AlinMat — Explicações</h1>
          <p>Lembrete de aula</p>
        </div>
        <div class="body">
          <span class="when-badge">⏰ ${when}</span>
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

function getBookingDateTime(date: string, timeSlot: string): Date {
  const startTime = timeSlot.split('-')[0].trim();
  return new Date(`${date}T${startTime}:00`);
}

serve(async () => {
  const now = new Date();

  const windows = [
    { label: '1 dia antes', minMs: 24 * 60 - 5, maxMs: 24 * 60 + 5, type: 'day' },
    { label: '1 hora antes', minMs: 55, maxMs: 65, type: 'hour' },
    { label: '15 minutos antes', minMs: 10, maxMs: 20, type: 'quarter' },
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
    const diffMinutes = (bookingTime.getTime() - now.getTime()) / (60 * 1000);

    for (const window of windows) {
      if (diffMinutes < window.minMs || diffMinutes > window.maxMs) continue;

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
      const studentOk = await sendEmail(userData.user.email, `⏰ Lembrete: explicação de ${booking.subject} — ${window.label}`, studentHtml);

      // Send to admin
      const adminHtml = emailTemplate(studentName, booking.subject, booking.date, booking.time_slot, window.label, true);
      await sendEmail(ADMIN_EMAIL, `⏰ Lembrete: explicação com ${studentName} — ${window.label}`, adminHtml);

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
