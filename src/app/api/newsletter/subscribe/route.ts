import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServiceSupabase } from '@/lib/server-bookings';

type SubscribeBody = {
  email?: string;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as SubscribeBody;
    const emailFromBody = body.email?.trim().toLowerCase();
    const authHeader = req.headers.get('authorization');
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const service = getServiceSupabase();

    if (authHeader?.startsWith('Bearer ') && url && anonKey) {
      const token = authHeader.replace(/^Bearer\s+/i, '').trim();
      const userClient = createClient(url, anonKey, {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });

      const { data: authData, error: authError } = await userClient.auth.getUser();
      if (!authError && authData.user) {
        const userEmail = authData.user.email?.trim().toLowerCase();
        await service
          .from('profiles')
          .update({ newsletter_opt_in: true })
          .eq('id', authData.user.id);

        if (userEmail) {
          await service.from('newsletter_contacts').upsert(
            {
              email: userEmail,
              source: 'account',
              status: 'active',
            },
            { onConflict: 'email' },
          );
        }

        return NextResponse.json({ success: true, source: 'account' });
      }
    }

    if (!emailFromBody) {
      return NextResponse.json({ error: 'Indica um email válido.' }, { status: 400 });
    }

    await service.from('newsletter_contacts').upsert(
      {
        email: emailFromBody,
        source: 'footer',
        status: 'active',
      },
      { onConflict: 'email' },
    );

    return NextResponse.json({ success: true, source: 'footer' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao aderir à newsletter.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
