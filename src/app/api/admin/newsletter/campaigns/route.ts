import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/server-bookings';
import { requireAdminFromRequest } from '@/lib/server-admin-auth';

export async function GET(req: NextRequest) {
  try {
    await requireAdminFromRequest(req);
    const supabase = getServiceSupabase();

    const [
      { data: campaigns, error: campaignsError },
      { data: accountSubscribers, error: accountSubscribersError },
      { data: footerSubscribers, error: footerSubscribersError },
    ] = await Promise.all([
      supabase
        .from('newsletter_campaigns')
        .select('id, subject, recipient_count, sent_count, failed_count, status, created_at, sent_at')
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('profiles')
        .select('id, email, full_name, username, created_at')
        .eq('newsletter_opt_in', true),
      supabase
        .from('newsletter_contacts')
        .select('id, email, source, created_at')
        .eq('status', 'active')
        .order('created_at', { ascending: false }),
    ]);

    if (campaignsError) {
      return NextResponse.json({ error: 'Não foi possível carregar campanhas.' }, { status: 500 });
    }
    if (accountSubscribersError) {
      return NextResponse.json({ error: 'Não foi possível carregar subscritores.' }, { status: 500 });
    }
    if (footerSubscribersError) {
      return NextResponse.json({ error: 'Não foi possível carregar subscritores externos.' }, { status: 500 });
    }

    const uniqueSubscribers = new Map<string, { id: string; email: string; name: string; source: 'account' | 'footer'; subscribed_at: string }>();

    (accountSubscribers || []).forEach((subscriber) => {
      const email = String(subscriber.email || '').trim().toLowerCase();
      if (!email) return;
      uniqueSubscribers.set(email, {
        id: String(subscriber.id),
        email,
        name: String(subscriber.full_name || subscriber.username || email),
        source: 'account',
        subscribed_at: String(subscriber.created_at || ''),
      });
    });

    (footerSubscribers || []).forEach((subscriber) => {
      const email = String(subscriber.email || '').trim().toLowerCase();
      if (!email) return;
      if (uniqueSubscribers.has(email)) return;
      uniqueSubscribers.set(email, {
        id: String(subscriber.id),
        email,
        name: email,
        source: 'footer',
        subscribed_at: String(subscriber.created_at || ''),
      });
    });

    const subscribers = Array.from(uniqueSubscribers.values()).sort((a, b) =>
      b.subscribed_at.localeCompare(a.subscribed_at),
    );

    return NextResponse.json({
      campaigns: campaigns || [],
      subscribersCount: subscribers.length,
      accountSubscribersCount: (accountSubscribers || []).length,
      footerSubscribersCount: subscribers.filter((subscriber) => subscriber.source === 'footer').length,
      subscribers: subscribers.slice(0, 200),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao carregar campanhas.';
    const status = message.includes('Sem autenticação válida.')
      ? 401
      : message.includes('administradores') || message.includes('Sessão inválida')
        ? 403
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
