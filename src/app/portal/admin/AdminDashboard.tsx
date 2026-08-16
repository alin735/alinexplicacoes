'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';

const MATERIALS_BUCKET = 'portal-materiais';

type Pin = {
  id: string;
  code: string;
  label: string | null;
  used_by: string | null;
  used_at: string | null;
  created_at: string;
  portal_students?: { name: string } | null;
};

type Material = {
  id: string;
  lesson_id: string | null;
  roadmap_id?: string | null;
  topic_id?: string | null;
  kind: string;
  title: string;
  storage_path: string | null;
  external_url: string | null;
};

type Lesson = {
  id: string;
  position: number;
  title: string;
  subtitle: string | null;
  contents: string | null;
  scheduled_at: string | null;
  is_unlocked: boolean;
  portal_lesson_materials?: Material[];
};

type Roadmap = {
  id: string;
  title: string;
  position: number;
};

type Student = {
  id: string;
  name: string;
  created_at: string;
  roadmap_id: string | null;
  preview_all: boolean;
};

const KIND_OPTIONS = [
  { value: 'powerpoint', label: 'PowerPoint' },
  { value: 'ficha', label: 'Ficha' },
  { value: 'tpc', label: 'TPC' },
  { value: 'gravacao', label: 'Gravação' },
  { value: 'importante', label: '⭐ Importante' },
  { value: 'outro', label: 'Outro' },
];

type Topic = {
  id: string;
  roadmap_id: string;
  parent_id: string | null;
  title: string;
  position: number;
};

/** Opções de tema/subtema achatadas para uma dropdown (subtemas indentados). */
function topicOptions(topics: Topic[]): { id: string; label: string }[] {
  const out: { id: string; label: string }[] = [];
  for (const tema of topics.filter((t) => !t.parent_id)) {
    out.push({ id: tema.id, label: tema.title });
    for (const sub of topics.filter((t) => t.parent_id === tema.id)) {
      out.push({ id: sub.id, label: `   ↳ ${sub.title}` });
    }
  }
  return out;
}

function TopicSelect({
  topics,
  value,
  onChange,
  className = '',
}: {
  topics: Topic[];
  value: string | null;
  onChange: (v: string | null) => void;
  className?: string;
}) {
  return (
    <select
      value={value || ''}
      onChange={(e) => onChange(e.target.value || null)}
      className={`rounded-lg border border-black/15 bg-white px-2 py-1.5 text-sm outline-none focus:border-black ${className}`}
    >
      <option value="">— sem tema —</option>
      {topicOptions(topics).map((o) => (
        <option key={o.id} value={o.id}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export default function AdminDashboard() {
  const [tab, setTab] = useState<'percursos' | 'alunos' | 'pins'>('percursos');

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight">Painel de administração</h1>
        <span className="rounded-full bg-black px-3 py-1 text-xs font-bold text-white">Admin</span>
      </div>

      <div className="mb-6 inline-flex gap-1 rounded-xl bg-black/5 p-1 text-sm font-semibold">
        <TabBtn active={tab === 'percursos'} onClick={() => setTab('percursos')}>
          Percursos
        </TabBtn>
        <TabBtn active={tab === 'alunos'} onClick={() => setTab('alunos')}>
          Alunos
        </TabBtn>
        <TabBtn active={tab === 'pins'} onClick={() => setTab('pins')}>
          PINs de acesso
        </TabBtn>
      </div>

      {tab === 'percursos' && <PercursosPanel />}
      {tab === 'alunos' && <AlunosPanel />}
      {tab === 'pins' && <PinsPanel />}
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-4 py-2 transition ${active ? 'bg-white shadow-sm' : 'text-black/50'}`}
    >
      {children}
    </button>
  );
}

// ─── Percursos ──────────────────────────────────────────────────────────────
function PercursosPanel() {
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [title, setTitle] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    const res = await fetch('/api/portal/admin/roadmaps');
    const data = await res.json();
    if (res.ok) setRoadmaps(data.roadmaps || []);
  }
  useEffect(() => {
    load();
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/portal/admin/roadmaps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      const data = await res.json();
      if (res.ok) {
        setTitle('');
        await load();
        setOpenId(data.roadmap?.id ?? null);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={create} className="flex gap-2 rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Novo percurso (ex.: Diogo, Matilde, 12.º B)"
          className="flex-1 rounded-lg border border-black/15 px-3 py-2 text-sm outline-none focus:border-black"
        />
        <button
          disabled={loading}
          className="rounded-lg bg-black px-5 py-2 text-sm font-bold text-white disabled:opacity-50"
        >
          Criar percurso
        </button>
      </form>

      {roadmaps.length === 0 && (
        <p className="rounded-2xl border border-dashed border-black/15 p-8 text-center text-sm text-black/45">
          Sem percursos ainda. Cria o primeiro (um por aluno).
        </p>
      )}

      {roadmaps.map((r) => (
        <RoadmapCard
          key={r.id}
          roadmap={r}
          open={openId === r.id}
          onToggle={() => setOpenId(openId === r.id ? null : r.id)}
          onChange={load}
        />
      ))}
    </div>
  );
}

function RoadmapCard({
  roadmap,
  open,
  onToggle,
  onChange,
}: {
  roadmap: Roadmap;
  open: boolean;
  onToggle: () => void;
  onChange: () => void;
}) {
  const [title, setTitle] = useState(roadmap.title);
  const [saving, setSaving] = useState(false);
  const [sub, setSub] = useState<'aulas' | 'importante'>('aulas');

  async function rename() {
    if (title.trim() === roadmap.title || !title.trim()) return;
    setSaving(true);
    try {
      await fetch('/api/portal/admin/roadmaps', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: roadmap.id, title: title.trim() }),
      });
      onChange();
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!confirm(`Apagar o percurso "${roadmap.title}" e todas as suas aulas?`)) return;
    const res = await fetch(`/api/portal/admin/roadmaps?id=${roadmap.id}`, { method: 'DELETE' });
    if (res.ok) onChange();
  }

  return (
    <div className="rounded-2xl border border-black/10 bg-white shadow-sm">
      <div className="flex items-center gap-3 p-4">
        <span className="text-lg">🎓</span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={rename}
          onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
          className="min-w-0 flex-1 rounded-lg border border-transparent px-2 py-1 text-base font-bold outline-none hover:border-black/10 focus:border-black"
        />
        {saving && <span className="text-xs text-black/40">a guardar…</span>}
        <button
          onClick={onToggle}
          className="rounded-lg border border-black/15 px-3 py-1.5 text-xs font-bold hover:bg-black/5"
        >
          {open ? 'Fechar' : 'Abrir'}
        </button>
        <button
          onClick={remove}
          className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-500 hover:bg-red-50"
        >
          Apagar
        </button>
      </div>
      {open && (
        <div className="border-t border-black/10 p-4">
          <div className="mb-4 inline-flex gap-1 rounded-lg bg-black/5 p-1 text-xs font-bold">
            <button
              onClick={() => setSub('aulas')}
              className={`rounded-md px-3 py-1.5 transition ${sub === 'aulas' ? 'bg-white shadow-sm' : 'text-black/50'}`}
            >
              Aulas
            </button>
            <button
              onClick={() => setSub('importante')}
              className={`rounded-md px-3 py-1.5 transition ${sub === 'importante' ? 'bg-white shadow-sm' : 'text-black/50'}`}
            >
              ⭐ Importante
            </button>
          </div>
          {sub === 'aulas' ? (
            <LessonsPanel roadmapId={roadmap.id} />
          ) : (
            <ImportantePanel roadmapId={roadmap.id} />
          )}
        </div>
      )}
    </div>
  );
}

// ─── Importante (temas + anexos) ────────────────────────────────────────────
function ImportantePanel({ roadmapId }: { roadmapId: string }) {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [lessons, setLessons] = useState<{ id: string; title: string; is_unlocked: boolean }[]>([]);
  const [newTema, setNewTema] = useState('');

  async function load() {
    const [tRes, mRes] = await Promise.all([
      fetch(`/api/portal/admin/topics?roadmap_id=${roadmapId}`),
      fetch(`/api/portal/admin/materials?roadmap_id=${roadmapId}`),
    ]);
    const tData = await tRes.json();
    const mData = await mRes.json();
    if (tRes.ok) setTopics(tData.topics || []);
    if (mRes.ok) {
      setMaterials(mData.materials || []);
      setLessons(mData.lessons || []);
    }
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roadmapId]);

  async function addTopic(title: string, parentId: string | null) {
    if (!title.trim()) return;
    await fetch('/api/portal/admin/topics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roadmap_id: roadmapId, parent_id: parentId, title: title.trim() }),
    });
    load();
  }

  async function renameTopic(id: string, title: string) {
    await fetch('/api/portal/admin/topics', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, title }),
    });
    load();
  }

  async function removeTopic(id: string, title: string) {
    if (!confirm(`Apagar "${title}"? Os anexos ficam sem tema, não se perdem.`)) return;
    await fetch(`/api/portal/admin/topics?id=${id}`, { method: 'DELETE' });
    load();
  }

  async function setMaterialTopic(id: string, topicId: string | null) {
    await fetch('/api/portal/admin/materials', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, topic_id: topicId }),
    });
    load();
  }

  async function removeMaterial(id: string) {
    if (!confirm('Apagar este anexo?')) return;
    await fetch(`/api/portal/admin/materials?id=${id}`, { method: 'DELETE' });
    load();
  }

  const lessonById = new Map(lessons.map((l) => [l.id, l]));
  const temas = topics.filter((t) => !t.parent_id);

  return (
    <div className="space-y-6">
      {/* Temas e subtemas */}
      <div className="rounded-xl bg-black/[0.03] p-4">
        <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-black/40">
          Temas e subtemas
        </h4>

        <div className="space-y-3">
          {temas.map((tema) => (
            <TemaRow
              key={tema.id}
              tema={tema}
              subtemas={topics.filter((t) => t.parent_id === tema.id)}
              onRename={renameTopic}
              onRemove={removeTopic}
              onAddSub={(title) => addTopic(title, tema.id)}
            />
          ))}
          {temas.length === 0 && (
            <p className="text-xs text-black/40">Sem temas. Cria o primeiro abaixo.</p>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            addTopic(newTema, null);
            setNewTema('');
          }}
          className="mt-3 flex gap-2"
        >
          <input
            value={newTema}
            onChange={(e) => setNewTema(e.target.value)}
            placeholder="Novo tema (ex.: Sucessões)"
            className="flex-1 rounded-lg border border-black/15 px-3 py-2 text-sm outline-none focus:border-black"
          />
          <button className="rounded-lg bg-black px-4 py-2 text-sm font-bold text-white">
            Criar tema
          </button>
        </form>
      </div>

      {/* Anexos importantes */}
      <div>
        <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-black/40">
          Anexos importantes ({materials.length})
        </h4>
        <ul className="mb-4 space-y-2">
          {materials.map((m) => {
            const lesson = m.lesson_id ? lessonById.get(m.lesson_id) : null;
            return (
              <li
                key={m.id}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-black/10 bg-white p-3 shadow-sm"
              >
                <span className="text-lg">⭐</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{m.title}</p>
                  <p className="truncate text-xs text-black/40">
                    {lesson ? (
                      <>
                        {lesson.title}
                        {!lesson.is_unlocked && (
                          <span className="ml-1 font-bold text-amber-600">
                            · 🔒 só visível quando desbloqueares a aula
                          </span>
                        )}
                      </>
                    ) : (
                      'item avulso'
                    )}
                  </p>
                </div>
                <TopicSelect
                  topics={topics}
                  value={m.topic_id ?? null}
                  onChange={(v) => setMaterialTopic(m.id, v)}
                />
                <button
                  onClick={() => removeMaterial(m.id)}
                  className="text-xs font-semibold text-red-500 hover:underline"
                >
                  Apagar
                </button>
              </li>
            );
          })}
          {materials.length === 0 && (
            <li className="rounded-xl border border-dashed border-black/15 p-6 text-center text-xs text-black/40">
              Sem anexos importantes. Marca anexos de aulas como “⭐ Importante” ou adiciona um item
              avulso abaixo.
            </li>
          )}
        </ul>

        <StandaloneForm roadmapId={roadmapId} topics={topics} onChange={load} />
      </div>
    </div>
  );
}

function TemaRow({
  tema,
  subtemas,
  onRename,
  onRemove,
  onAddSub,
}: {
  tema: Topic;
  subtemas: Topic[];
  onRename: (id: string, title: string) => void;
  onRemove: (id: string, title: string) => void;
  onAddSub: (title: string) => void;
}) {
  const [title, setTitle] = useState(tema.title);
  const [newSub, setNewSub] = useState('');

  return (
    <div className="rounded-lg bg-white p-3 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="text-sm">📁</span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => title.trim() && title !== tema.title && onRename(tema.id, title.trim())}
          onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
          className="min-w-0 flex-1 rounded border border-transparent px-2 py-1 text-sm font-bold outline-none hover:border-black/10 focus:border-black"
        />
        <button
          onClick={() => onRemove(tema.id, tema.title)}
          className="text-xs font-semibold text-red-500 hover:underline"
        >
          Apagar
        </button>
      </div>

      <div className="ml-6 mt-1 space-y-1">
        {subtemas.map((s) => (
          <SubtemaRow key={s.id} subtema={s} onRename={onRename} onRemove={onRemove} />
        ))}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onAddSub(newSub);
            setNewSub('');
          }}
          className="flex gap-2 pt-1"
        >
          <input
            value={newSub}
            onChange={(e) => setNewSub(e.target.value)}
            placeholder="+ subtema"
            className="flex-1 rounded border border-black/10 px-2 py-1 text-xs outline-none focus:border-black"
          />
          {newSub.trim() && (
            <button className="rounded bg-black px-3 py-1 text-xs font-bold text-white">Juntar</button>
          )}
        </form>
      </div>
    </div>
  );
}

function SubtemaRow({
  subtema,
  onRename,
  onRemove,
}: {
  subtema: Topic;
  onRename: (id: string, title: string) => void;
  onRemove: (id: string, title: string) => void;
}) {
  const [title, setTitle] = useState(subtema.title);
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-black/30">↳</span>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={() => title.trim() && title !== subtema.title && onRename(subtema.id, title.trim())}
        onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
        className="min-w-0 flex-1 rounded border border-transparent px-2 py-0.5 text-xs outline-none hover:border-black/10 focus:border-black"
      />
      <button
        onClick={() => onRemove(subtema.id, subtema.title)}
        className="text-[11px] font-semibold text-red-400 hover:underline"
      >
        ✕
      </button>
    </div>
  );
}

/** Item avulso: anexo Importante ligado ao percurso, sem pertencer a nenhuma aula. */
function StandaloneForm({
  roadmapId,
  topics,
  onChange,
}: {
  roadmapId: string;
  topics: Topic[];
  onChange: () => void;
}) {
  const [title, setTitle] = useState('');
  const [topicId, setTopicId] = useState<string | null>(null);
  const [externalUrl, setExternalUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim()) return setError('Dá um título ao anexo.');
    if (!file && !externalUrl.trim()) return setError('Carrega um ficheiro ou indica um link.');
    setUploading(true);
    try {
      let storagePath: string | null = null;
      if (file) {
        const urlRes = await fetch('/api/portal/admin/materials/upload-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roadmap_id: roadmapId, filename: file.name }),
        });
        const urlData = await urlRes.json();
        if (!urlRes.ok) throw new Error(urlData?.error || 'Erro a preparar o upload.');

        const supabase = createClient();
        const { error: upErr } = await supabase.storage
          .from(MATERIALS_BUCKET)
          .uploadToSignedUrl(urlData.path, urlData.token, file);
        if (upErr) throw new Error(upErr.message);
        storagePath = urlData.path as string;
      }

      const res = await fetch('/api/portal/admin/materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roadmap_id: roadmapId,
          topic_id: topicId,
          kind: 'importante',
          title: title.trim(),
          storage_path: storagePath,
          external_url: storagePath ? null : externalUrl.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Erro ao guardar.');

      setTitle('');
      setExternalUrl('');
      setFile(null);
      setTopicId(null);
      onChange();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <form onSubmit={add} className="space-y-2 rounded-xl bg-black/[0.03] p-4">
      <h4 className="text-xs font-bold uppercase tracking-wide text-black/40">
        Adicionar item avulso
      </h4>
      <div className="flex flex-wrap gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título (ex.: Formulário do exame)"
          className="min-w-[200px] flex-1 rounded-lg border border-black/15 px-3 py-2 text-sm outline-none focus:border-black"
        />
        <TopicSelect topics={topics} value={topicId} onChange={setTopicId} />
      </div>
      <input
        type="file"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        className="w-full text-xs text-black/60 file:mr-3 file:rounded-lg file:border-0 file:bg-black file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-white"
      />
      <input
        value={externalUrl}
        onChange={(e) => setExternalUrl(e.target.value)}
        placeholder="… ou link externo (https://)"
        className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm outline-none focus:border-black"
      />
      {error && <p className="text-xs font-semibold text-red-500">{error}</p>}
      <button
        disabled={uploading}
        className="rounded-lg bg-black px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
      >
        {uploading ? 'A carregar…' : 'Adicionar'}
      </button>
    </form>
  );
}

// ─── Alunos ─────────────────────────────────────────────────────────────────
function AlunosPanel() {
  const [students, setStudents] = useState<Student[]>([]);
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);

  async function load() {
    const [sRes, rRes] = await Promise.all([
      fetch('/api/portal/admin/students'),
      fetch('/api/portal/admin/roadmaps'),
    ]);
    const sData = await sRes.json();
    const rData = await rRes.json();
    if (sRes.ok) setStudents(sData.students || []);
    if (rRes.ok) setRoadmaps(rData.roadmaps || []);
  }
  useEffect(() => {
    load();
  }, []);

  async function patch(id: string, fields: Record<string, unknown>) {
    await fetch('/api/portal/admin/students', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...fields }),
    });
    load();
  }

  async function remove(id: string, name: string) {
    if (!confirm(`Apagar o aluno "${name}"? Perde o acesso e o progresso.`)) return;
    const res = await fetch(`/api/portal/admin/students?id=${id}`, { method: 'DELETE' });
    if (res.ok) load();
  }

  if (students.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-black/15 p-8 text-center text-sm text-black/45">
        Ainda não há alunos inscritos. Gera um PIN e partilha-o para o aluno se inscrever.
      </p>
    );
  }

  return (
    <div className="space-y-2.5">
      {students.map((s) => (
        <div
          key={s.id}
          className="flex flex-wrap items-center gap-3 rounded-xl border border-black/10 bg-white p-4 shadow-sm"
        >
          <div className="min-w-0 flex-1">
            <p className="font-bold">{s.name}</p>
            <p className="text-xs text-black/40">
              inscrito em {new Date(s.created_at).toLocaleDateString('pt-PT')}
            </p>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <span className="text-xs font-semibold uppercase tracking-wide text-black/45">Percurso</span>
            <select
              value={s.preview_all ? '' : s.roadmap_id || ''}
              disabled={s.preview_all}
              onChange={(e) => patch(s.id, { roadmap_id: e.target.value || null })}
              className="rounded-lg border border-black/15 bg-white px-2 py-1.5 text-sm outline-none focus:border-black disabled:opacity-50"
            >
              <option value="">— nenhum —</option>
              {roadmaps.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-1.5 text-sm font-semibold">
            <input
              type="checkbox"
              checked={s.preview_all}
              onChange={(e) => patch(s.id, { preview_all: e.target.checked })}
              className="h-4 w-4"
            />
            Vê todos
          </label>

          <button
            onClick={() => remove(s.id, s.name)}
            className="text-xs font-semibold text-red-500 hover:underline"
          >
            Apagar
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── PINs ─────────────────────────────────────────────────────────────────────
function PinsPanel() {
  const [pins, setPins] = useState<Pin[]>([]);
  const [label, setLabel] = useState('');
  const [count, setCount] = useState(1);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  async function load() {
    const res = await fetch('/api/portal/admin/pins');
    const data = await res.json();
    if (res.ok) setPins(data.pins || []);
  }
  useEffect(() => {
    load();
  }, []);

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/portal/admin/pins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label, count }),
      });
      if (res.ok) {
        setLabel('');
        setCount(1);
        await load();
      }
    } finally {
      setLoading(false);
    }
  }

  async function remove(id: string) {
    if (!confirm('Apagar este PIN?')) return;
    const res = await fetch(`/api/portal/admin/pins?id=${id}`, { method: 'DELETE' });
    if (res.ok) load();
  }

  function copy(code: string) {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <div className="grid gap-6 md:grid-cols-[300px_1fr]">
      <form
        onSubmit={generate}
        className="h-fit space-y-3 rounded-2xl border border-black/10 bg-white p-5 shadow-sm"
      >
        <h2 className="font-bold">Gerar PIN</h2>
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Etiqueta (ex.: Maria, 12.ºB)"
          className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm outline-none focus:border-black"
        />
        <label className="block text-xs font-semibold text-black/50">
          Quantidade
          <input
            type="number"
            min={1}
            max={50}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2 text-sm outline-none focus:border-black"
          />
        </label>
        <button
          disabled={loading}
          className="w-full rounded-lg bg-black py-2.5 text-sm font-bold text-white disabled:opacity-50"
        >
          {loading ? 'A gerar…' : 'Gerar'}
        </button>
      </form>

      <div className="space-y-2">
        {pins.length === 0 && (
          <p className="rounded-2xl border border-dashed border-black/15 p-8 text-center text-sm text-black/45">
            Ainda não há PINs. Gera um para inscrever um aluno.
          </p>
        )}
        {pins.map((p) => (
          <div
            key={p.id}
            className="flex items-center gap-3 rounded-xl border border-black/10 bg-white p-3 shadow-sm"
          >
            <button
              onClick={() => copy(p.code)}
              className="rounded-lg bg-black/5 px-3 py-1.5 font-mono text-sm font-bold tracking-wider hover:bg-black/10"
              title="Copiar"
            >
              {p.code}
            </button>
            {copied === p.code && <span className="text-xs font-semibold text-emerald-600">copiado!</span>}
            <div className="min-w-0 flex-1">
              {p.label && <p className="truncate text-sm font-semibold">{p.label}</p>}
              {p.used_by ? (
                <p className="text-xs font-semibold text-emerald-600">
                  ✓ usado {p.portal_students?.name ? `por ${p.portal_students.name}` : ''}
                </p>
              ) : (
                <p className="text-xs font-semibold text-black/40">disponível</p>
              )}
            </div>
            {!p.used_by && (
              <button
                onClick={() => remove(p.id)}
                className="text-xs font-semibold text-red-500 hover:underline"
              >
                Apagar
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Aulas ────────────────────────────────────────────────────────────────────
function toLocalInput(value: string | null): string {
  if (!value) return '';
  const d = new Date(value);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function LessonsPanel({ roadmapId }: { roadmapId: string }) {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);

  async function load() {
    const [res, tRes] = await Promise.all([
      fetch(`/api/portal/admin/lessons?roadmap_id=${roadmapId}`),
      fetch(`/api/portal/admin/topics?roadmap_id=${roadmapId}`),
    ]);
    const data = await res.json();
    const tData = await tRes.json();
    if (res.ok) setLessons(data.lessons || []);
    if (tRes.ok) setTopics(tData.topics || []);
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roadmapId]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/portal/admin/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, roadmap_id: roadmapId }),
      });
      if (res.ok) {
        setTitle('');
        await load();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <form
        onSubmit={create}
        className="flex gap-2 rounded-2xl border border-black/10 bg-white p-4 shadow-sm"
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Nova aula (ex.: Estatística: média, mediana e quartis)"
          className="flex-1 rounded-lg border border-black/15 px-3 py-2 text-sm outline-none focus:border-black"
        />
        <button
          disabled={loading}
          className="rounded-lg bg-black px-5 py-2 text-sm font-bold text-white disabled:opacity-50"
        >
          Adicionar
        </button>
      </form>

      {lessons.length === 0 && (
        <p className="rounded-2xl border border-dashed border-black/15 p-8 text-center text-sm text-black/45">
          Sem aulas ainda. Cria a primeira acima.
        </p>
      )}

      {lessons.map((lesson) => (
        <LessonCard key={lesson.id} lesson={lesson} topics={topics} onChange={load} />
      ))}
    </div>
  );
}

function LessonCard({
  lesson,
  topics,
  onChange,
}: {
  lesson: Lesson;
  topics: Topic[];
  onChange: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(lesson.title);
  const [subtitle, setSubtitle] = useState(lesson.subtitle || '');
  const [contents, setContents] = useState(lesson.contents || '');
  const [scheduledAt, setScheduledAt] = useState(toLocalInput(lesson.scheduled_at));
  const [saving, setSaving] = useState(false);
  const materials = lesson.portal_lesson_materials || [];

  async function patch(fields: Record<string, unknown>) {
    const res = await fetch('/api/portal/admin/lessons', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: lesson.id, ...fields }),
    });
    if (res.ok) onChange();
  }

  async function save() {
    setSaving(true);
    try {
      await patch({
        title,
        subtitle,
        contents,
        scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
      });
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!confirm('Apagar esta aula e os seus materiais?')) return;
    const res = await fetch(`/api/portal/admin/lessons?id=${lesson.id}`, { method: 'DELETE' });
    if (res.ok) onChange();
  }

  return (
    <div className="rounded-2xl border border-black/10 bg-white shadow-sm">
      <div className="flex items-center gap-3 p-4">
        <span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-full bg-black/5 text-sm font-bold">
          {lesson.position}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold">{lesson.title}</p>
          <p className="text-xs text-black/45">
            {materials.length} material(is)
            {lesson.scheduled_at
              ? ` · ${new Date(lesson.scheduled_at).toLocaleDateString('pt-PT')}`
              : ''}
          </p>
        </div>
        <button
          onClick={() => patch({ is_unlocked: !lesson.is_unlocked })}
          className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
            lesson.is_unlocked
              ? 'bg-emerald-500 text-white'
              : 'bg-black/5 text-black/50 hover:bg-black/10'
          }`}
        >
          {lesson.is_unlocked ? '🔓 Desbloqueada' : '🔒 Bloqueada'}
        </button>
        <button
          onClick={() => setOpen((o) => !o)}
          className="rounded-lg border border-black/15 px-3 py-1.5 text-xs font-bold hover:bg-black/5"
        >
          {open ? 'Fechar' : 'Editar'}
        </button>
      </div>

      {open && (
        <div className="space-y-4 border-t border-black/10 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <LabeledInput label="Título" value={title} onChange={setTitle} />
            <LabeledInput label="Subtítulo" value={subtitle} onChange={setSubtitle} />
          </div>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-black/50">Conteúdos</span>
            <textarea
              value={contents}
              onChange={(e) => setContents(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm outline-none focus:border-black"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-black/50">Data agendada</span>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="rounded-lg border border-black/15 px-3 py-2 text-sm outline-none focus:border-black"
            />
          </label>
          <div className="flex gap-2">
            <button
              onClick={save}
              disabled={saving}
              className="rounded-lg bg-black px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
            >
              {saving ? 'A guardar…' : 'Guardar'}
            </button>
            <button
              onClick={remove}
              className="rounded-lg border border-red-200 px-4 py-2 text-sm font-bold text-red-500 hover:bg-red-50"
            >
              Apagar aula
            </button>
          </div>

          <MaterialsEditor
            lessonId={lesson.id}
            topics={topics}
            materials={materials}
            onChange={onChange}
          />
        </div>
      )}
    </div>
  );
}

function MaterialsEditor({
  lessonId,
  topics,
  materials,
  onChange,
}: {
  lessonId: string;
  topics: Topic[];
  materials: Material[];
  onChange: () => void;
}) {
  const [kind, setKind] = useState('powerpoint');
  const [title, setTitle] = useState('');
  const [topicId, setTopicId] = useState<string | null>(null);
  const [externalUrl, setExternalUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim()) return setError('Dá um título ao material.');
    if (!file && !externalUrl.trim()) return setError('Carrega um ficheiro ou indica um link.');
    setUploading(true);
    try {
      let storagePath: string | null = null;

      if (file) {
        // 1) Pedir um URL de upload assinado.
        const urlRes = await fetch('/api/portal/admin/materials/upload-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lesson_id: lessonId, filename: file.name }),
        });
        const urlData = await urlRes.json();
        if (!urlRes.ok) throw new Error(urlData?.error || 'Erro a preparar o upload.');

        // 2) Enviar o ficheiro DIRETAMENTE ao Supabase (sem passar pelo servidor).
        const supabase = createClient();
        const { error: upErr } = await supabase.storage
          .from(MATERIALS_BUCKET)
          .uploadToSignedUrl(urlData.path, urlData.token, file);
        if (upErr) throw new Error(upErr.message);
        storagePath = urlData.path as string;
      }

      // 3) Registar o material.
      const res = await fetch('/api/portal/admin/materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lesson_id: lessonId,
          kind,
          topic_id: kind === 'importante' ? topicId : null,
          title: title.trim(),
          storage_path: storagePath,
          external_url: storagePath ? null : externalUrl.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Erro ao guardar o material.');

      setTitle('');
      setExternalUrl('');
      setFile(null);
      setTopicId(null);
      onChange();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function remove(id: string) {
    const res = await fetch(`/api/portal/admin/materials?id=${id}`, { method: 'DELETE' });
    if (res.ok) onChange();
  }

  return (
    <div className="rounded-xl bg-black/[0.03] p-4">
      <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-black/40">Materiais</h4>
      <ul className="mb-3 space-y-1.5">
        {materials.map((m) => (
          <li
            key={m.id}
            className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm shadow-sm"
          >
            <span className="rounded bg-black/5 px-2 py-0.5 text-[11px] font-bold uppercase text-black/50">
              {m.kind}
            </span>
            <span className="min-w-0 flex-1 truncate font-semibold">{m.title}</span>
            <span className="text-xs text-black/40">{m.storage_path ? 'ficheiro' : 'link'}</span>
            <button
              onClick={() => remove(m.id)}
              className="text-xs font-semibold text-red-500 hover:underline"
            >
              Apagar
            </button>
          </li>
        ))}
        {materials.length === 0 && <li className="text-xs text-black/40">Sem materiais.</li>}
      </ul>

      <form onSubmit={add} className="space-y-2">
        <div className="flex gap-2">
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value)}
            className="rounded-lg border border-black/15 bg-white px-2 py-2 text-sm outline-none focus:border-black"
          >
            {KIND_OPTIONS.map((k) => (
              <option key={k.value} value={k.value}>
                {k.label}
              </option>
            ))}
          </select>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título do material"
            className="flex-1 rounded-lg border border-black/15 px-3 py-2 text-sm outline-none focus:border-black"
          />
        </div>
        {kind === 'importante' && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-black/45">Tema</span>
            <TopicSelect topics={topics} value={topicId} onChange={setTopicId} />
            <span className="text-[11px] text-black/40">
              aparece também na aba ⭐ Importante do aluno
            </span>
          </div>
        )}
        {kind === 'gravacao' ? (
          <>
            <input
              value={externalUrl}
              onChange={(e) => setExternalUrl(e.target.value)}
              placeholder="Cola o link do YouTube (vídeo não listado)"
              className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm outline-none focus:border-black"
            />
            <p className="text-[11px] text-black/45">
              A gravação toca embutida na página da aula. Usa um vídeo não listado do YouTube (ou Vimeo).
            </p>
          </>
        ) : (
          <>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full text-xs text-black/60 file:mr-3 file:rounded-lg file:border-0 file:bg-black file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-white"
            />
            <input
              value={externalUrl}
              onChange={(e) => setExternalUrl(e.target.value)}
              placeholder="… ou link externo (https://)"
              className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm outline-none focus:border-black"
            />
          </>
        )}
        {error && <p className="text-xs font-semibold text-red-500">{error}</p>}
        <button
          disabled={uploading}
          className="rounded-lg bg-black px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
        >
          {uploading ? 'A carregar…' : 'Adicionar material'}
        </button>
      </form>
    </div>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-black/50">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm outline-none focus:border-black"
      />
    </label>
  );
}
