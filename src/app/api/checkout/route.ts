import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { getServiceSupabase } from '@/lib/server-bookings';
import { parseBookingMeta } from '@/lib/booking-utils';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bookingId } = body;

    if (!bookingId) {
      return NextResponse.json({ error: 'bookingId em falta.' }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('id, subject, date, time_slot, observations, price')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Marcação não encontrada.' }, { status: 404 });
    }

    if (booking.price <= 0) {
      return NextResponse.json({ error: 'Preço inválido para checkout.' }, { status: 400 });
    }

    const meta = parseBookingMeta(booking.observations);
    const lessonLabel =
      meta?.mode === 'group' && meta.size > 1
        ? `Aula de grupo (${meta.size} alunos)`
        : 'Aula individual';

    const stripe = getStripe();
    const origin = req.headers.get('origin') || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Explicação de ${booking.subject}`,
              description: `${booking.date} · ${booking.time_slot} · ${lessonLabel}`,
            },
            unit_amount: booking.price,
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
