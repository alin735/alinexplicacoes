import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/server-bookings';
import { getStudentSessionId } from '@/lib/portal-session';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const studentId = getStudentSessionId();
  if (!studentId) {
    return NextResponse.json({ error: 'Sem sessão.' }, { status: 401 });
  }

  let body: { lesson_id?: string; completed?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Pedido inválido.' }, { status: 400 });
  }

  const lessonId = body.lesson_id;
  const completed = Boolean(body.completed);
  if (!lessonId) {
    return NextResponse.json({ error: 'Falta a aula.' }, { status: 400 });
  }

  const service = getServiceSupabase();

  // Só permite concluir aulas desbloqueadas.
  const { data: lesson } = await service
    .from('portal_lessons')
    .select('is_unlocked')
    .eq('id', lessonId)
    .maybeSingle();
  if (!lesson || !(lesson as { is_unlocked: boolean }).is_unlocked) {
    return NextResponse.json({ error: 'Aula indisponível.' }, { status: 403 });
  }

  const { error } = await service.from('portal_lesson_progress').upsert(
    {
      student_id: studentId,
      lesson_id: lessonId,
      completed,
      completed_at: completed ? new Date().toISOString() : null,
    },
    { onConflict: 'student_id,lesson_id' },
  );
  if (error) {
    return NextResponse.json({ error: 'Não foi possível guardar.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, completed });
}
