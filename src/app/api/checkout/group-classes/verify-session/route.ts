import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  try {
    const { sessionId } = await req.json();
    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json({ error: 'sessionId em falta.' }, { status: 400 });
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    return NextResponse.json({
      paid: session.payment_status === 'paid',
      paymentStatus: session.payment_status,
    });
  } catch (err: any) {
    console.error('Verify group class session error:', err);
    return NextResponse.json({ error: err.message || 'Erro ao verificar sessão.' }, { status: 500 });
  }
}
