import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/server-bookings';
import { requireAdminFromRequest } from '@/lib/server-admin-auth';

export const dynamic = 'force-dynamic';

function errorStatus(message: string) {
  if (message.includes('Sem autenticação válida.')) return 401;
  if (message.includes('administradores') || message.includes('Sessão inválida')) return 403;
  return 500;
}

/** Resultados do inquérito das disciplinas, já contados por disciplina, curso e ano. */
export async function GET(req: NextRequest) {
  try {
    await requireAdminFromRequest(req);
    const supabase = getServiceSupabase();

    const { data, error } = await supabase
      .from('waitlist_subject_interest')
      .select('email, full_name, course, school_year, subjects, other_subject, updated_at')
      .order('updated_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: 'Não foi possível carregar as respostas. Falta correr a migração waitlist_subject_interest?' },
        { status: 500 },
      );
    }

    const responses = data || [];
    const bySubject = new Map<string, number>();
    const byCourse = new Map<string, number>();
    const byYear = new Map<string, number>();

    responses.forEach((row) => {
      (row.subjects || []).forEach((subject: string) => {
        bySubject.set(subject, (bySubject.get(subject) || 0) + 1);
      });
      const course = row.course || 'Sem curso';
      byCourse.set(course, (byCourse.get(course) || 0) + 1);
      const year = row.school_year || 'Sem ano';
      byYear.set(year, (byYear.get(year) || 0) + 1);
    });

    const toSortedList = (map: Map<string, number>) =>
      Array.from(map.entries())
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => b.count - a.count);

    return NextResponse.json({
      responseCount: responses.length,
      bySubject: toSortedList(bySubject),
      byCourse: toSortedList(byCourse),
      byYear: toSortedList(byYear),
      others: responses
        .map((row) => row.other_subject)
        .filter((value): value is string => Boolean(value)),
      responses,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao carregar as respostas.';
    return NextResponse.json({ error: message }, { status: errorStatus(message) });
  }
}
