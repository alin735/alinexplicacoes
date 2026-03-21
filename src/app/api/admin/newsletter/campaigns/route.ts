import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/server-bookings';
import { requireAdminFromRequest } from '@/lib/server-admin-auth';

export async function GET(req: NextRequest) {
  try {
    await requireAdminFromRequest(req);
    const supabase = getServiceSupabase();

    const [{ data: campaigns, error: campaignsError }, { count, error: countError }] = await Promise.all([
      supabase
        .from('newsletter_campaigns')
        .select('id, subject, recipient_count, sent_count, failed_count, status, created_at, sent_at')
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('newsletter_opt_in', true),
    ]);

    if (campaignsError) {
      return NextResponse.json({ error: 'Não foi possível carregar campanhas.' }, { status: 500 });
    }
    if (countError) {
      return NextResponse.json({ error: 'Não foi possível carregar subscritores.' }, { status: 500 });
    }

    return NextResponse.json({
      campaigns: campaigns || [],
      subscribersCount: count ?? 0,
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
