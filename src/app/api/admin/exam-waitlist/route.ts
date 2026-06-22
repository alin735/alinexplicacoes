import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/server-bookings';
import { requireAdminFromRequest } from '@/lib/server-admin-auth';

function errorStatus(message: string) {
  if (message.includes('Sem autenticação válida.')) return 401;
  if (message.includes('administradores') || message.includes('Sessão inválida')) return 403;
  return 500;
}

export async function GET(req: NextRequest) {
  try {
    await requireAdminFromRequest(req);
    const supabase = getServiceSupabase();

    const { data, error } = await supabase
      .from('exam_correction_waitlist')
      .select('id, full_name, email, phone, course, status, notes, joined_at, updated_at')
      .order('joined_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Não foi possível carregar a lista de espera.' }, { status: 500 });
    }

    return NextResponse.json({ leads: data || [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao carregar a lista de espera.';
    return NextResponse.json({ error: message }, { status: errorStatus(message) });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireAdminFromRequest(req);
    const body = (await req.json().catch(() => ({}))) as {
      id?: string;
      status?: string;
      notes?: string;
    };

    const id = typeof body.id === 'string' ? body.id.trim() : '';
    if (!id) {
      return NextResponse.json({ error: 'Falta o identificador do aluno.' }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    if (body.status === 'active' || body.status === 'contacted') {
      updates.status = body.status;
    }
    if (typeof body.notes === 'string') {
      updates.notes = body.notes.trim() || null;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Nada para atualizar.' }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    const { error } = await supabase.from('exam_correction_waitlist').update(updates).eq('id', id);

    if (error) {
      return NextResponse.json({ error: 'Não foi possível atualizar o aluno.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao atualizar o aluno.';
    return NextResponse.json({ error: message }, { status: errorStatus(message) });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireAdminFromRequest(req);
    const { searchParams } = new URL(req.url);
    const id = (searchParams.get('id') || '').trim();

    if (!id) {
      return NextResponse.json({ error: 'Falta o identificador do aluno.' }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    const { error } = await supabase.from('exam_correction_waitlist').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ error: 'Não foi possível remover o aluno.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao remover o aluno.';
    return NextResponse.json({ error: message }, { status: errorStatus(message) });
  }
}
