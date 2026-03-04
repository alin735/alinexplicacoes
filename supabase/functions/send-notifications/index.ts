import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

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

function emailTemplate(studentName: string, subject: string, date: string, timeSlot: string, when: string) {
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
          <p style="color:#0d2f4a; font-size:16px; margin:0 0 20px;">Olá, <strong>${studentName}</strong>! Tens uma explicação agendada.</p>
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

serve(async () => {
  const now = new Date();

  // Windows: 1 day (23h55 → 24h05), 1 hour (55min → 65min), 15min (10min → 20min)
  const windows = [
    { label: '1 dia antes', minFrom: 23 * 60 + 55, minTo: 24 * 60 + 5, type: 'day' },
    { label: '1 hora antes', minFrom: 55, minTo: 65, type: 'hour' },
    { label: '15 minutos antes', minFrom: 10, minTo: 20, type: 'quarter' },
  ];

  let sent = 0;

  for (const window of windows) {
    const fromTime = new Date(now.getTime() + window.minFrom * 60 * 1000);
    const toTime = new Date(now.getTime() + window.minTo * 60 * 1000);

    // Get confirmed bookings in this time window
    const { data: bookings } = await supabase
      .from('bookings')
      .select('*, profiles!bookings_student_id_fkey(full_name, username)')
      .eq('status', 'confirmed')
      .gte('date', fromTime.toISOString().split('T')[0])
      .lte('date', toTime.toISOString().split('T')[0]);

    if (!bookings) continue;

    for (const booking of bookings) {
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
      const html = emailTemplate(studentName, booking.subject, booking.date, booking.time_slot, window.label);
      const ok = await sendEmail(userData.user.email, `⏰ Lembrete: explicação de ${booking.subject} — ${window.label}`, html);

      if (ok) {
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
