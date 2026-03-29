import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import {
  sendBookingConfirmationEmails,
  sendPaymentReceivedWaitingForBooking,
} from '@/lib/booking-email-notifications';
import { confirmBookingPayment } from '@/lib/server-bookings';

export async function POST(req: NextRequest) {
  try {
    const { bookingId, sessionId } = await req.json();

    if (!bookingId || !sessionId) {
      return NextResponse.json({ error: 'bookingId e sessionId são obrigatórios.' }, { status: 400 });
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session || session.payment_status !== 'paid') {
      return NextResponse.json({ error: 'O pagamento ainda não foi confirmado pelo Stripe.' }, { status: 409 });
    }

    if (session.metadata?.booking_id !== bookingId) {
      return NextResponse.json({ error: 'Sessão de checkout inválida para esta marcação.' }, { status: 400 });
    }

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

    return NextResponse.json({
      success: true,
      confirmedBookingIds,
      fully_confirmed: confirmedBookingIds.length > 0,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Não foi possível finalizar o checkout.' },
      { status: 500 },
    );
  }
}
