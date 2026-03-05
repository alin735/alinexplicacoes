import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { LESSON_PRICE } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bookingId, subject, date, timeSlot } = body;

    if (!bookingId || !subject || !date || !timeSlot) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const stripe = getStripe();
    const origin = req.headers.get('origin') || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Explicação de ${subject}`,
              description: `${date} · ${timeSlot}`,
            },
            unit_amount: LESSON_PRICE,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/marcar/sucesso?session_id={CHECKOUT_SESSION_ID}&booking_id=${bookingId}`,
      cancel_url: `${origin}/marcar/cancelado?booking_id=${bookingId}`,
      metadata: {
        booking_id: bookingId,
      },
    });

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (err: any) {
    console.error('Checkout error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
