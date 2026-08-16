import { redirect } from 'next/navigation';
import { getServiceSupabase } from '@/lib/server-bookings';
import {
  getPortalStudent,
  videoEmbedUrl,
  visibleRoadmapIds,
  type PortalMaterial,
  type PortalTopic,
} from '@/lib/portal';
import PortalTabs from '../PortalTabs';

export const dynamic = 'force-dynamic';

type Item = PortalMaterial & { lessonTitle?: string | null };

export default async function ImportantePage() {
  const student = await getPortalStudent();
  if (!student) redirect('/');

  const service = getServiceSupabase();
  const roadmapIds = await visibleRoadmapIds(student);

  if (roadmapIds.length === 0) {
    return (
      <div>
        <PortalTabs active="importante" />
        <EmptyState>Ainda não tens um percurso atribuído.</EmptyState>
      </div>
    );
  }

  // Aulas do(s) percurso(s): só as DESBLOQUEADAS contribuem com anexos.
  const { data: lessons } = await service
    .from('portal_lessons')
    .select('id, title, is_unlocked')
    .in('roadmap_id', roadmapIds);

  const unlocked = (lessons || []).filter((l: any) => l.is_unlocked);
  const lessonTitleById = new Map(unlocked.map((l: any) => [l.id, l.title as string]));
  const unlockedIds = unlocked.map((l: any) => l.id);

  // Anexos importantes: itens avulsos do percurso + anexos de aulas desbloqueadas.
  const [{ data: standalone }, { data: fromLessons }, { data: topicsData }] = await Promise.all([
    service
      .from('portal_lesson_materials')
      .select('*')
      .eq('kind', 'importante')
      .in('roadmap_id', roadmapIds)
      .order('position', { ascending: true }),
    unlockedIds.length
      ? service
          .from('portal_lesson_materials')
          .select('*')
          .eq('kind', 'importante')
          .in('lesson_id', unlockedIds)
          .order('position', { ascending: true })
      : Promise.resolve({ data: [] as PortalMaterial[] }),
    service
      .from('portal_topics')
      .select('*')
      .in('roadmap_id', roadmapIds)
      .order('position', { ascending: true }),
  ]);

  const items: Item[] = [
    ...((standalone || []) as PortalMaterial[]),
    ...((fromLessons || []) as PortalMaterial[]).map((m) => ({
      ...m,
      lessonTitle: m.lesson_id ? lessonTitleById.get(m.lesson_id) ?? null : null,
    })),
  ];

  if (items.length === 0) {
    return (
      <div>
        <PortalTabs active="importante" />
        <EmptyState>
          Ainda não há nada aqui. Os materiais mais importantes das tuas aulas vão aparecer nesta secção.
        </EmptyState>
      </div>
    );
  }

  // Assinar os ficheiros do storage.
  const signed = await Promise.all(
    items.map(async (m) => {
      let url = m.external_url;
      if (m.storage_path) {
        const { data } = await service.storage
          .from('portal-materiais')
          .createSignedUrl(m.storage_path, 60 * 60);
        url = data?.signedUrl ?? url;
      }
      return { ...m, url };
    }),
  );

  const topics = (topicsData || []) as PortalTopic[];
  const temas = topics.filter((t) => !t.parent_id);
  const subtemasDe = (temaId: string) => topics.filter((t) => t.parent_id === temaId);
  const itemsDe = (topicId: string) => signed.filter((m) => m.topic_id === topicId);
  const semTema = signed.filter((m) => !m.topic_id || !topics.some((t) => t.id === m.topic_id));

  return (
    <div>
      <PortalTabs active="importante" />

      <div className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight">Importante</h1>
        <p className="mt-1 text-sm text-black/55">
          O essencial das tuas aulas, reunido e organizado por tema.
        </p>
      </div>

      <div className="space-y-8">
        {temas.map((tema) => {
          const diretos = itemsDe(tema.id);
          const subs = subtemasDe(tema.id).map((s) => ({ sub: s, items: itemsDe(s.id) }));
          const total = diretos.length + subs.reduce((n, s) => n + s.items.length, 0);
          if (total === 0) return null;

          return (
            <section key={tema.id}>
              <h2 className="mb-3 border-b border-black/10 pb-2 text-lg font-extrabold tracking-tight">
                {tema.title}
              </h2>
              {diretos.length > 0 && <ItemList items={diretos} />}
              {subs.map(
                ({ sub, items }) =>
                  items.length > 0 && (
                    <div key={sub.id} className="mt-4">
                      <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-black/45">
                        {sub.title}
                      </h3>
                      <ItemList items={items} />
                    </div>
                  ),
              )}
            </section>
          );
        })}

        {semTema.length > 0 && (
          <section>
            <h2 className="mb-3 border-b border-black/10 pb-2 text-lg font-extrabold tracking-tight">
              Outros
            </h2>
            <ItemList items={semTema} />
          </section>
        )}
      </div>
    </div>
  );
}

function ItemList({ items }: { items: (Item & { url?: string | null })[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((m) => {
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
                  <span className="text-lg">⭐</span>
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
              <span className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-lg bg-amber-50 text-xl">
                ⭐
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{m.title}</p>
                {m.lessonTitle && (
                  <p className="truncate text-xs font-semibold text-black/40">{m.lessonTitle}</p>
                )}
              </div>
              <span className="text-sm font-bold text-black/50">Abrir ↗</span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-black/15 bg-white/60 p-10 text-center text-sm text-black/50">
      {children}
    </div>
  );
}
