import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import {
  sendEmail,
  confirmationEmailTemplate,
  paymentReceivedWaitingEmailTemplate,
  ADMIN_EMAIL,
} from '@/lib/email';
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

async function sendPaymentReceivedWaitingForBooking(bookingId: string) {
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

  if (!studentEmail) return;

  const studentHtml = paymentReceivedWaitingEmailTemplate(
    studentName,
    booking.subject,
    booking.date,
    booking.time_slot,
  );
  await sendEmail(studentEmail, `💳 Pagamento recebido — ${booking.subject}`, studentHtml);
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const bookingId = session.metadata?.booking_id;

    if (bookingId && session.payment_status === 'paid') {
      try {
        const { confirmedBookingIds, booking, paymentJustMarkedPaid } = await confirmBookingPayment(
          bookingId,
          session.id,
        );

        if (
          paymentJustMarkedPaid &&
          booking.payment_method === 'online' &&
          confirmedBookingIds.length === 0
        ) {
          await sendPaymentReceivedWaitingForBooking(bookingId);
        }

        for (const confirmedId of confirmedBookingIds) {
          await sendConfirmationForBooking(confirmedId);
        }
      } catch (emailErr) {
        console.error('Erro ao processar confirmação no webhook:', emailErr);
      }

      console.log(`Booking ${bookingId} payment confirmed via Stripe`);
    }
  }

  return NextResponse.json({ received: true });
}
