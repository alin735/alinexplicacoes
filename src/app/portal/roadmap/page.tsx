import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServiceSupabase } from '@/lib/server-bookings';
import {
  getPortalStudent,
  lessonStatus,
  nextStreak,
  todayLisbon,
  type PortalLesson,
  type LessonStatus,
} from '@/lib/portal';

export const dynamic = 'force-dynamic';

const STATUS_STYLES: Record<LessonStatus, { label: string; badge: string; ring: string; dot: string }> = {
  concluida: {
    label: 'Concluída',
    badge: 'bg-emerald-50 text-emerald-700',
    ring: 'border-emerald-200',
    dot: 'bg-emerald-500',
  },
  desbloqueada: {
    label: 'Disponível',
    badge: 'bg-black text-white',
    ring: 'border-black/15',
    dot: 'bg-black',
  },
  bloqueada: {
    label: 'Bloqueada',
    badge: 'bg-black/5 text-black/45',
    ring: 'border-black/10',
    dot: 'bg-black/20',
  },
};

function formatDate(value: string | null): string | null {
  if (!value) return null;
  return new Intl.DateTimeFormat('pt-PT', {
    weekday: 'short',
    day: '2-digit',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Lisbon',
  }).format(new Date(value));
}

export default async function RoadmapPage() {
  const student = await getPortalStudent();
  if (!student) redirect('/');

  const service = getServiceSupabase();

  // Atualiza a streak na visita (uma vez por dia).
  const today = todayLisbon();
  let streak = student.streak_count;
  if (student.last_active_date !== today) {
    streak = nextStreak(student.last_active_date, student.streak_count, today);
    await service
      .from('portal_students')
      .update({ last_active_date: today, streak_count: streak })
      .eq('id', student.id);
  }

  const [{ data: lessonsData }, { data: progressData }] = await Promise.all([
    service.from('portal_lessons').select('*').order('position', { ascending: true }),
    service
      .from('portal_lesson_progress')
      .select('lesson_id, completed')
      .eq('student_id', student.id),
  ]);

  const lessons = (lessonsData || []) as PortalLesson[];
  const completedSet = new Set(
    (progressData || []).filter((p: any) => p.completed).map((p: any) => p.lesson_id),
  );

  const total = lessons.length;
  const doneCount = lessons.filter((l) => completedSet.has(l.id)).length;
  const pct = total ? Math.round((doneCount / total) * 100) : 0;

  return (
    <div>
      {/* Cabeçalho / boas-vindas */}
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-black/40">
            O teu roadmap
          </p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight">
            Olá, {student.name.split(' ')[0]} 👋
          </h1>
          <p className="mt-1 text-sm text-black/55">
            {doneCount} de {total} aulas concluídas · época especial de Matemática A
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3">
          <span className="text-2xl">🔥</span>
          <div>
            <p className="text-2xl font-extrabold leading-none text-orange-600">{streak}</p>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-orange-500">
              {streak === 1 ? 'dia' : 'dias'} de streak
            </p>
          </div>
        </div>
      </div>

      {/* Barra de progresso */}
      {total > 0 && (
        <div className="mb-8">
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-black/10">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-1.5 text-right text-xs font-semibold text-black/40">{pct}%</p>
        </div>
      )}

      {/* Lista de aulas */}
      {total === 0 ? (
        <div className="rounded-2xl border border-dashed border-black/15 bg-white/60 p-10 text-center text-sm text-black/50">
          Ainda não há aulas no teu roadmap. Assim que forem agendadas, aparecem aqui.
        </div>
      ) : (
        <ol className="space-y-3">
          {lessons.map((lesson, i) => {
            const status = lessonStatus(lesson, completedSet.has(lesson.id));
            const s = STATUS_STYLES[status];
            const when = formatDate(lesson.scheduled_at);
            const locked = status === 'bloqueada';

            const card = (
              <div
                className={`flex items-start gap-4 rounded-2xl border bg-white p-5 shadow-sm transition ${s.ring} ${
                  locked ? 'opacity-70' : 'hover:shadow-md'
                }`}
              >
                <div className="flex flex-col items-center gap-2 pt-0.5">
                  <span
                    className={`grid h-8 w-8 place-items-center rounded-full text-sm font-bold text-white ${s.dot}`}
                  >
                    {status === 'concluida' ? '✓' : i + 1}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold">{lesson.title}</h3>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${s.badge}`}>
                      {locked ? '🔒 ' : ''}
                      {s.label}
                    </span>
                  </div>
                  {lesson.subtitle && (
                    <p className="mt-0.5 text-sm text-black/55">{lesson.subtitle}</p>
                  )}
                  {when && (
                    <p className="mt-2 text-xs font-semibold text-black/45">📅 {when}</p>
                  )}
                  {lesson.contents && (
                    <p className="mt-2 line-clamp-2 text-sm text-black/60">{lesson.contents}</p>
                  )}
                  {!locked && (
                    <span className="mt-3 inline-block text-sm font-bold text-black">
                      Abrir aula →
                    </span>
                  )}
                </div>
              </div>
            );

            return (
              <li key={lesson.id}>
                {locked ? card : <Link href={`/aula/${lesson.id}`}>{card}</Link>}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
