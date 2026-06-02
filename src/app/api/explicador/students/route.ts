import { NextRequest, NextResponse } from 'next/server';
import { requireTutorFromRequest, tutorAuthErrorStatus } from '@/lib/server-tutor-auth';
import { getServiceSupabase } from '@/lib/server-bookings';

function handleError(error: unknown) {
  const message = error instanceof Error ? error.message : 'Erro inesperado.';
  return NextResponse.json({ error: message }, { status: tutorAuthErrorStatus(message) });
}

// GET — alunos que já marcaram (ou tiveram) aula com este explicador.
// O explicador só vê os seus alunos, nunca a lista completa de utilizadores.
export async function GET(req: NextRequest) {
  try {
    const { tutor } = await requireTutorFromRequest(req);
    const supabase = getServiceSupabase();

    const { data, error } = await supabase
      .from('bookings')
      .select('student_id, profiles(*)')
      .eq('tutor_id', tutor.id);

    if (error) {
      return NextResponse.json({ error: 'Não foi possível carregar os alunos.' }, { status: 500 });
    }

    const byId = new Map<string, any>();
    for (const row of data || []) {
      const profile = (row as any).profiles;
      if (profile?.id && !byId.has(profile.id)) {
        byId.set(profile.id, profile);
      }
    }

    const students = Array.from(byId.values()).sort((a, b) =>
      (a.full_name || a.username || '').localeCompare(b.full_name || b.username || '', 'pt'),
    );

    return NextResponse.json({ students });
  } catch (error) {
    return handleError(error);
  }
}
