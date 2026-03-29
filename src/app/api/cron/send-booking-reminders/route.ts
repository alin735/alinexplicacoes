import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_EMAIL, bookingReminderEmailTemplate, sendEmail } from '@/lib/email';
import { getServiceSupabase } from '@/lib/server-bookings';

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

function isAuthorizedCronRequest(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return true;

  const authHeader = req.headers.get('authorization');
  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(req: NextRequest) {
  if (!isAuthorizedCronRequest(req)) {
    return NextResponse.json({ error: 'Sem autorização para executar o cron.' }, { status: 401 });
  }

  try {
    const now = new Date();
    const windows = [
      { label: '1 dia antes', minMinutes: 24 * 60 - 5, maxMinutes: 24 * 60 + 5, type: 'day' as const },
      { label: '1 hora antes', minMinutes: 55, maxMinutes: 65, type: 'hour' as const },
      { label: '15 minutos antes', minMinutes: 10, maxMinutes: 20, type: 'quarter' as const },
    ];

    const supabase = getServiceSupabase();
    const todayStr = now.toISOString().split('T')[0];
    const twoDaysLater = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('*, profiles!bookings_student_id_fkey(full_name, username)')
      .eq('status', 'confirmed')
      .gte('date', todayStr)
      .lte('date', twoDaysLater);

    if (bookingsError) {
      return NextResponse.json({ error: 'Não foi possível carregar as marcações.' }, { status: 500 });
    }

    let sent = 0;

    for (const booking of bookings || []) {
      const bookingTime = getBookingDateTime(booking.date, booking.time_slot);
      if (!bookingTime) continue;

      const diffMinutes = (bookingTime.getTime() - now.getTime()) / (60 * 1000);
      if (!Number.isFinite(diffMinutes)) continue;

      for (const window of windows) {
        if (diffMinutes < window.minMinutes || diffMinutes > window.maxMinutes) continue;

        if (window.type === 'day') {
          const bookingCreatedAt = booking.created_at ? new Date(booking.created_at) : null;
          const oneDayBeforeLesson = new Date(bookingTime.getTime() - 24 * 60 * 60 * 1000);
          if (!bookingCreatedAt || bookingCreatedAt > oneDayBeforeLesson) {
            continue;
          }
        }

        const { data: existing } = await supabase
          .from('notification_log')
          .select('id')
          .eq('booking_id', booking.id)
          .eq('type', window.type)
          .maybeSingle();

        if (existing) continue;

        const { data: userData } = await supabase.auth.admin.getUserById(booking.student_id);
        if (!userData?.user?.email) continue;

        const studentName = booking.profiles?.full_name || booking.profiles?.username || 'Aluno';
        const studentHtml = bookingReminderEmailTemplate(
          studentName,
          booking.subject,
          booking.date,
          booking.time_slot,
          window.label,
          false,
        );
        const adminHtml = bookingReminderEmailTemplate(
          studentName,
          booking.subject,
          booking.date,
          booking.time_slot,
          window.label,
          true,
        );

        const studentOk = await sendEmail(
          userData.user.email,
          `Lembrete: explicação de ${booking.subject} — ${window.label}`,
          studentHtml,
        );
        await sendEmail(
          ADMIN_EMAIL,
          `Lembrete: explicação com ${studentName} — ${window.label}`,
          adminHtml,
        );

        if (studentOk) {
          await supabase.from('notification_log').insert({
            booking_id: booking.id,
            type: window.type,
            sent_at: now.toISOString(),
          });
          sent += 1;
        }
      }
    }

    return NextResponse.json({ success: true, sent });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao enviar lembretes.' },
      { status: 500 },
    );
  }
}
