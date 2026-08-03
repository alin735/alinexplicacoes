import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getServiceSupabase } from '@/lib/server-bookings';
import {
  getPortalStudent,
  MATERIAL_LABELS,
  videoEmbedUrl,
  type PortalLesson,
  type PortalMaterial,
} from '@/lib/portal';
import LessonCompleteButton from './LessonCompleteButton';

export const dynamic = 'force-dynamic';

const KIND_ICON: Record<string, string> = {
  powerpoint: '📊',
  ficha: '📄',
  tpc: '✏️',
  gravacao: '🎬',
  outro: '📎',
};

function formatDate(value: string | null): string | null {
  if (!value) return null;
  return new Intl.DateTimeFormat('pt-PT', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Lisbon',
  }).format(new Date(value));
}

export default async function AulaPage({ params }: { params: { id: string } }) {
  const student = await getPortalStudent();
  if (!student) redirect('/');

  const service = getServiceSupabase();

  const { data: lessonData } = await service
    .from('portal_lessons')
    .select('*')
    .eq('id', params.id)
    .maybeSingle();

  const lesson = lessonData as PortalLesson | null;
  if (!lesson) notFound();

  // Aula ainda bloqueada: não revela materiais.
  if (!lesson.is_unlocked) {
    return (
      <div className="mx-auto max-w-2xl pt-4">
        <BackLink />
        <div className="mt-6 rounded-2xl border border-black/10 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-black/5 text-2xl">
            🔒
          </div>
          <h1 className="text-xl font-extrabold">{lesson.title}</h1>
          <p className="mt-2 text-sm text-black/55">
            Esta aula ainda está bloqueada. Fica disponível depois de a fazermos: o
            PowerPoint com os desenhos e as fichas aparecem aqui.
          </p>
        </div>
      </div>
    );
  }

  // Materiais + signed URLs.
  const { data: materialsData } = await service
    .from('portal_lesson_materials')
    .select('*')
    .eq('lesson_id', lesson.id)
    .order('position', { ascending: true });

  const materials = (materialsData || []) as PortalMaterial[];
  const withUrls = await Promise.all(
    materials.map(async (m) => {
      let url = m.external_url;
      if (m.storage_path) {
        const { data } = await service.storage
          .from('portal-materiais')
          .createSignedUrl(m.storage_path, 60 * 60); // 1 hora
        url = data?.signedUrl ?? url;
      }
      return { ...m, url };
    }),
  );

  // Regista a visualização e obtém o estado de conclusão.
  const { data: progress } = await service
    .from('portal_lesson_progress')
    .upsert(
      { student_id: student.id, lesson_id: lesson.id, viewed_at: new Date().toISOString() },
      { onConflict: 'student_id,lesson_id' },
    )
    .select('completed')
    .maybeSingle();

  const completed = Boolean((progress as { completed?: boolean } | null)?.completed);
  const when = formatDate(lesson.scheduled_at);

  return (
    <div className="mx-auto max-w-2xl pt-4">
      <BackLink />

      <div className="mt-5">
        <h1 className="text-3xl font-extrabold tracking-tight">{lesson.title}</h1>
        {lesson.subtitle && <p className="mt-1 text-black/60">{lesson.subtitle}</p>}
        {when && <p className="mt-2 text-sm font-semibold text-black/45">📅 {when}</p>}
      </div>

      {lesson.contents && (
        <div className="mt-6 rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-black/40">
            O que vais rever
          </h2>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-black/75">
            {lesson.contents}
          </p>
        </div>
      )}

      <div className="mt-6">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-black/40">
          Materiais
        </h2>
        {withUrls.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-black/15 bg-white/60 p-8 text-center text-sm text-black/50">
            Os materiais desta aula ainda estão a ser preparados.
          </div>
        ) : (
          <ul className="space-y-3">
            {withUrls.map((m) => {
              const embed = videoEmbedUrl(m.external_url);
              if (embed) {
                return (
                  <li key={m.id}>
                    <div className="overflow-hidden rounded-xl border border-black/10 bg-white shadow-sm">
                      <div className="aspect-video w-full bg-black">
                        <iframe
                          src={embed}
                          title={m.title}
                          className="h-full w-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                      <div className="flex items-center gap-2 px-4 py-3">
                        <span className="text-lg">{KIND_ICON[m.kind] || '🎬'}</span>
                        <p className="truncate font-semibold">{m.title}</p>
                      </div>
                    </div>
                  </li>
                );
              }
              return (
                <li key={m.id}>
                  <a
                    href={m.url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-xl border border-black/10 bg-white p-4 shadow-sm transition hover:border-black/25 hover:shadow-md"
                  >
                    <span className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-lg bg-black/5 text-xl">
                      {KIND_ICON[m.kind] || '📎'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{m.title}</p>
                      <p className="text-xs font-semibold uppercase tracking-wide text-black/40">
                        {MATERIAL_LABELS[m.kind]}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-black/50">Abrir ↗</span>
                  </a>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="mt-8">
        <LessonCompleteButton lessonId={lesson.id} initialCompleted={completed} />
      </div>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/roadmap"
      className="inline-flex items-center gap-1 text-sm font-semibold text-black/50 hover:text-black"
    >
      ← Voltar ao roadmap
    </Link>
  );
}
