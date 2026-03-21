import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendEmail, confirmationEmailTemplate, ADMIN_EMAIL } from '@/lib/email';

function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  try {
    const { bookingId } = await req.json();
    if (!bookingId) {
      return NextResponse.json({ error: 'Missing bookingId' }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Get booking details
    const { data: booking } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Get student profile and email
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, username')
      .eq('id', booking.student_id)
      .single();

    const { data: userData } = await supabase.auth.admin.getUserById(booking.student_id);
    const studentEmail = userData?.user?.email;
    const studentName = profile?.full_name || profile?.username || 'Aluno';

    // Send to student
    if (studentEmail) {
      const studentHtml = confirmationEmailTemplate(
        studentName, booking.subject, booking.date, booking.time_slot, false
      );
      await sendEmail(studentEmail, `Marcação confirmada — ${booking.subject}`, studentHtml);
    }

    // Send to admin
    const adminHtml = confirmationEmailTemplate(
      studentName, booking.subject, booking.date, booking.time_slot, true
    );
    await sendEmail(ADMIN_EMAIL, `Nova marcação — ${studentName} · ${booking.subject}`, adminHtml);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error sending confirmation email:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
