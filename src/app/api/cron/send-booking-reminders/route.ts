import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_EMAIL, bookingReminderEmailTemplate, getReminderSubject, sendEmail } from '@/lib/email';
import { getServiceSupabase } from '@/lib/server-bookings';
import { getSlotStartDateTime } from '@/lib/slots';

const LESSONS_TIME_ZONE = 'Europe/Lisbon';
const REMINDER_LOOKBACK_MS = 5 * 60 * 1000;

function getBookingDateTime(date: string, timeSlot: string): Date | null {
  const startTimeRaw = timeSlot.split('-')[0]?.trim();
  if (!startTimeRaw) return null;

  const bookingTime = getSlotStartDateTime(date, startTimeRaw);
  return Number.isNaN(bookingTime.getTime()) ? null : bookingTime;
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

function shouldSendReminder(now: Date, reminderAt: Date) {
  const diffMs = now.getTime() - reminderAt.getTime();
  return diffMs >= 0 && diffMs < REMINDER_LOOKBACK_MS;
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
      { offsetMinutes: 24 * 60, type: 'day' as const },
      { offsetMinutes: 60, type: 'hour' as const },
      { offsetMinutes: 15, type: 'quarter' as const },
    ];

    const supabase = getServiceSupabase();
    const todayStr = getDateValueInTimeZone(now, LESSONS_TIME_ZONE);
    const twoDaysLater = getDateValueInTimeZone(new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), LESSONS_TIME_ZONE);

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

      for (const window of windows) {
        const reminderAt = new Date(bookingTime.getTime() - window.offsetMinutes * 60 * 1000);
        if (!shouldSendReminder(now, reminderAt)) continue;

        if (window.type === 'day') {
          const bookingCreatedAt = booking.created_at ? new Date(booking.created_at) : null;
          if (!bookingCreatedAt || bookingCreatedAt > reminderAt) {
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
          window.type,
          false,
        );
        const adminHtml = bookingReminderEmailTemplate(
          studentName,
          booking.subject,
          booking.date,
          booking.time_slot,
          window.type,
          true,
        );

        const studentOk = await sendEmail(
          userData.user.email,
          getReminderSubject(window.type, booking.subject, false),
          studentHtml,
        );
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
