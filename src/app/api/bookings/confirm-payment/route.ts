import { NextRequest, NextResponse } from 'next/server';
import { confirmationEmailTemplate, sendEmail, ADMIN_EMAIL } from '@/lib/email';
import { confirmBookingPayment, getServiceSupabase } from '@/lib/server-bookings';

async function sendConfirmationForBooking(bookingId: string) {
  const supabase = getServiceSupabase();

  const { data: booking } = await supabase
    .from('bookings')
    .select('id, student_id, subject, date, time_slot')
    .eq('id', bookingId)
    .single();

  if (!booking) return;

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, username')
    .eq('id', booking.student_id)
    .single();

  const { data: userData } = await supabase.auth.admin.getUserById(booking.student_id);
  const studentName = profile?.full_name || profile?.username || 'Aluno';
  const studentEmail = userData?.user?.email;

  if (studentEmail) {
    const studentHtml = confirmationEmailTemplate(
      studentName,
      booking.subject,
      booking.date,
      booking.time_slot,
      false,
    );
    await sendEmail(studentEmail, `✅ Marcação confirmada — ${booking.subject}`, studentHtml);
  }

  const adminHtml = confirmationEmailTemplate(
    studentName,
    booking.subject,
    booking.date,
    booking.time_slot,
    true,
  );
  await sendEmail(ADMIN_EMAIL, `📋 Nova marcação — ${studentName} · ${booking.subject}`, adminHtml);
}

export async function POST(req: NextRequest) {
  try {
    const { bookingId } = await req.json();
    if (!bookingId) {
      return NextResponse.json({ error: 'bookingId em falta.' }, { status: 400 });
    }

    const { confirmedBookingIds } = await confirmBookingPayment(bookingId);
    for (const confirmedId of confirmedBookingIds) {
      await sendConfirmationForBooking(confirmedId);
    }

    return NextResponse.json({
      success: true,
      confirmedBookingIds,
      fully_confirmed: confirmedBookingIds.length > 0,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Não foi possível confirmar o pagamento.' },
      { status: 500 },
    );
  }
}
