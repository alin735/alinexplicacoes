import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getStripe } from '@/lib/stripe';
import {
  GROUP_CLASS_SCHOOL_YEAR,
  getGroupClassPackage,
} from '@/lib/group-classes';

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

    const { schoolYear, packageId, selectedLessons } = await req.json();
    if (schoolYear !== GROUP_CLASS_SCHOOL_YEAR) {
      return NextResponse.json({ error: 'As aulas de grupo selecionadas ainda não estão disponíveis.' }, { status: 400 });
    }

    const selectedPackage = getGroupClassPackage(packageId || 'completo');
    if (!selectedPackage) {
      return NextResponse.json({ error: 'Pacote inválido.' }, { status: 400 });
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
      payment_method_types: ['card', 'mb_way', 'revolut_pay'],
      mode: 'payment',
      customer_email: user.email || undefined,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: selectedPackage.stripeName,
              description: selectedPackage.stripeDescription,
            },
            unit_amount: selectedPackage.priceCents,
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/marcar/sucesso?group_class=${GROUP_CLASS_SCHOOL_YEAR}&group_package=${selectedPackage.id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/preparacao#pacotes`,
      metadata: {
        type: 'group_class',
        school_year: GROUP_CLASS_SCHOOL_YEAR,
        group_package_id: selectedPackage.id,
        group_package_name: selectedPackage.title,
        user_id: user.id,
        ...(Array.isArray(selectedLessons) && selectedLessons.length > 0
          ? { selected_lessons: JSON.stringify(selectedLessons.map((l: any) => l.id ?? l.date)) }
          : {}),
      },
    });

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (err: any) {
    console.error('Group class checkout error:', err);
    return NextResponse.json({ error: err.message || 'Erro ao criar pagamento.' }, { status: 500 });
  }
}
