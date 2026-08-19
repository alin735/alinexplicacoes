import { redirect } from 'next/navigation';
import { getServiceSupabase } from '@/lib/server-bookings';
import {
  getPortalStudent,
  videoEmbedUrl,
  visibleRoadmapIds,
  type PortalMaterial,
  type PortalSection,
  type PortalTopic,
} from '@/lib/portal';
import PortalTabs from '../PortalTabs';

type Item = PortalMaterial & { lessonTitle?: string | null; url?: string | null };

/**
 * Vista partilhada das secções de anexos (Importante, Fichas, Testes).
 * Cada secção junta os anexos do seu tipo vindos de aulas já desbloqueadas
 * com os itens avulsos ligados ao percurso, agrupados por tema e subtema.
 */
export default async function SectionView({ section }: { section: PortalSection }) {
  const student = await getPortalStudent();
  if (!student) redirect('/');

  const service = getServiceSupabase();
  const roadmapIds = await visibleRoadmapIds(student);

  if (roadmapIds.length === 0) {
    return (
      <Wrapper section={section}>
        <EmptyState>Ainda não tens um percurso atribuído.</EmptyState>
      </Wrapper>
    );
  }

  // Só as aulas desbloqueadas contribuem com anexos.
  const { data: lessons } = await service
    .from('portal_lessons')
    .select('id, title, is_unlocked')
    .in('roadmap_id', roadmapIds);

  const unlocked = (lessons || []).filter((l: any) => l.is_unlocked);
  const lessonTitleById = new Map(unlocked.map((l: any) => [l.id, l.title as string]));
  const unlockedIds = unlocked.map((l: any) => l.id);

  const [{ data: standalone }, { data: fromLessons }, { data: topicsData }] = await Promise.all([
    service
      .from('portal_lesson_materials')
      .select('*')
      .eq('kind', section.kind)
      .in('roadmap_id', roadmapIds)
      .order('position', { ascending: true }),
    unlockedIds.length
      ? service
          .from('portal_lesson_materials')
          .select('*')
          .eq('kind', section.kind)
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
      <Wrapper section={section}>
        <EmptyState>{section.vazio}</EmptyState>
      </Wrapper>
    );
  }

  const signed: Item[] = await Promise.all(
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

  // Secções sem organização por tema mostram uma lista simples.
  if (!section.temas) {
    return (
      <Wrapper section={section}>
        <ItemList items={signed} emoji={section.emoji} />
      </Wrapper>
    );
  }

  const topics = (topicsData || []) as PortalTopic[];
  const temas = topics.filter((t) => !t.parent_id);
  const subtemasDe = (id: string) => topics.filter((t) => t.parent_id === id);
  const itemsDe = (id: string) => signed.filter((m) => m.topic_id === id);
  const semTema = signed.filter((m) => !m.topic_id || !topics.some((t) => t.id === m.topic_id));

  return (
    <Wrapper section={section}>
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
              {diretos.length > 0 && <ItemList items={diretos} emoji={section.emoji} />}
              {subs.map(
                ({ sub, items }) =>
                  items.length > 0 && (
                    <div key={sub.id} className="mt-4">
                      <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-black/45">
                        {sub.title}
                      </h3>
                      <ItemList items={items} emoji={section.emoji} />
                    </div>
                  ),
              )}
            </section>
          );
        })}

        {semTema.length > 0 && (
          <section>
            {temas.length > 0 && (
              <h2 className="mb-3 border-b border-black/10 pb-2 text-lg font-extrabold tracking-tight">
                Outros
              </h2>
            )}
            <ItemList items={semTema} emoji={section.emoji} />
          </section>
        )}
      </div>
    </Wrapper>
  );
}

function Wrapper({ section, children }: { section: PortalSection; children: React.ReactNode }) {
  return (
    <div>
      <PortalTabs active={section.slug} />
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight">{section.titulo}</h1>
        <p className="mt-1 text-sm text-black/55">{section.descricao}</p>
      </div>
      {children}
    </div>
  );
}

function ItemList({ items, emoji }: { items: Item[]; emoji: string }) {
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
                  <span className="text-lg">{emoji}</span>
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
                {emoji}
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
