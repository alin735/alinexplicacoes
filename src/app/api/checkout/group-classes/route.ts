import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getStripe } from '@/lib/stripe';

const GROUP_CLASS_PRICE_CENTS = 7000;

function getUserClient(authHeader: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error('Configuração Supabase incompleta no servidor.');
  }

  return createClient(url, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Sem autenticação válida.' }, { status: 401 });
    }

    const { schoolYear } = await req.json();
    if (schoolYear !== '9ano') {
      return NextResponse.json({ error: 'As aulas de grupo selecionadas ainda não estão disponíveis.' }, { status: 400 });
    }

    const userClient = getUserClient(authHeader);
    const { data: authData, error: authError } = await userClient.auth.getUser();
    if (authError || !authData.user) {
      return NextResponse.json({ error: 'Sessão inválida.' }, { status: 401 });
    }

    const user = authData.user;
    const stripe = getStripe();
    const origin = req.headers.get('origin') || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: user.email || undefined,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Aulas de grupo de Matemática 9.º Ano',
              description: 'Mensalidade com duas aulas por semana, 1 hora por aula.',
            },
            recurring: {
              interval: 'month',
            },
            unit_amount: GROUP_CLASS_PRICE_CENTS,
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/marcar/sucesso?group_class=9ano&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/marcar?tipo=grupo`,
      metadata: {
        type: 'group_class',
        school_year: '9ano',
        user_id: user.id,
      },
      subscription_data: {
        metadata: {
          type: 'group_class',
          school_year: '9ano',
          user_id: user.id,
        },
      },
    });

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (err: any) {
    console.error('Group class checkout error:', err);
    return NextResponse.json({ error: err.message || 'Erro ao criar pagamento.' }, { status: 500 });
  }
}
