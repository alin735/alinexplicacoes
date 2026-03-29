import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import {
  sendBookingConfirmationEmails,
  sendPaymentReceivedWaitingForBooking,
} from '@/lib/booking-email-notifications';
import { confirmBookingPayment } from '@/lib/server-bookings';

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
          await sendBookingConfirmationEmails(confirmedId);
        }
      } catch (emailErr) {
        console.error('Erro ao processar confirmação no webhook:', emailErr);
      }

      console.log(`Booking ${bookingId} payment confirmed via Stripe`);
    }
  }

  return NextResponse.json({ received: true });
}
