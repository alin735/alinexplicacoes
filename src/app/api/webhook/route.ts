import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';
import { sendEmail, confirmationEmailTemplate, ADMIN_EMAIL } from '@/lib/email';

// Use service role for webhook (no user context)
function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, serviceKey);
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
      const supabase = getServiceSupabase();

      await supabase
        .from('bookings')
        .update({
          payment_status: 'paid',
          status: 'confirmed',
          stripe_session_id: session.id,
        })
        .eq('id', bookingId);

      // Send confirmation emails
      try {
        const { data: booking } = await supabase
          .from('bookings').select('*').eq('id', bookingId).single();

        if (booking) {
          const { data: profile } = await supabase
            .from('profiles').select('full_name, username').eq('id', booking.student_id).single();
          const { data: userData } = await supabase.auth.admin.getUserById(booking.student_id);

          const studentName = profile?.full_name || profile?.username || 'Aluno';
          const studentEmail = userData?.user?.email;

          if (studentEmail) {
            const studentHtml = confirmationEmailTemplate(studentName, booking.subject, booking.date, booking.time_slot, false);
            await sendEmail(studentEmail, `✅ Marcação confirmada — ${booking.subject}`, studentHtml);
          }

          const adminHtml = confirmationEmailTemplate(studentName, booking.subject, booking.date, booking.time_slot, true);
          await sendEmail(ADMIN_EMAIL, `📋 Nova marcação — ${studentName} · ${booking.subject}`, adminHtml);
        }
      } catch (emailErr) {
        console.error('Failed to send confirmation emails:', emailErr);
      }

      console.log(`Booking ${bookingId} payment confirmed via Stripe`);
    }
  }

  return NextResponse.json({ received: true });
}
