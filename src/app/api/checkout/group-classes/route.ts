import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getStripe } from '@/lib/stripe';
import {
  GROUP_CLASS_SCHOOL_YEAR,
  getGroupClassPackage,
} from '@/lib/group-classes';
import {
  getUserPurchasedLessonIds,
  lessonIdsForPackage,
  userHasCompletePackage,
} from '@/lib/group-class-purchases';

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
    if (selectedPackage.disabled) {
      return NextResponse.json({ error: 'Este pacote está temporariamente indisponível.' }, { status: 403 });
    }

    const userClient = getUserClient(authHeader);
    const { data: authData, error: authError } = await userClient.auth.getUser();
    if (authError || !authData.user) {
      return NextResponse.json({ error: 'Sessão inválida.' }, { status: 401 });
    }

    const user = authData.user;

    // Calcular IDs de aulas que esta compra cobre.
    const incomingLessonIds = Array.isArray(selectedLessons)
      ? selectedLessons.map((l: any) => Number(l.id ?? l)).filter((n: number) => Number.isInteger(n))
      : [];

    let targetLessonIds: number[];
    try {
      targetLessonIds = lessonIdsForPackage(selectedPackage.id, incomingLessonIds);
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }

    // Validar contra compras anteriores.
    if (selectedPackage.id === 'completo') {
      const alreadyHasCompleto = await userHasCompletePackage(user.id);
      if (alreadyHasCompleto) {
        return NextResponse.json(
          { error: 'Já adquiriste o Pacote Completo. Não é possível comprá-lo novamente.' },
          { status: 409 },
        );
      }
    } else {
      const ownedIds = new Set(await getUserPurchasedLessonIds(user.id));
      const conflicts = targetLessonIds.filter((id) => ownedIds.has(id));
      if (conflicts.length > 0) {
        return NextResponse.json(
          {
            error: `Já tens acesso a ${conflicts.length === 1 ? 'esta aula' : 'estas aulas'} (${conflicts.join(', ')}). Escolhe outras.`,
            conflictLessonIds: conflicts,
          },
          { status: 409 },
        );
      }
    }

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
        selected_lessons: JSON.stringify(targetLessonIds),
      },
    });

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (err: any) {
    console.error('Group class checkout error:', err);
    return NextResponse.json({ error: err.message || 'Erro ao criar pagamento.' }, { status: 500 });
  }
}
