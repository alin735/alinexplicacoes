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
  lesson_id: string;
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

const KIND_OPTIONS = [
  { value: 'powerpoint', label: 'PowerPoint' },
  { value: 'ficha', label: 'Ficha' },
  { value: 'tpc', label: 'TPC' },
  { value: 'gravacao', label: 'Gravação' },
  { value: 'outro', label: 'Outro' },
];

export default function AdminDashboard() {
  const [tab, setTab] = useState<'aulas' | 'pins'>('aulas');

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight">Painel de administração</h1>
        <span className="rounded-full bg-black px-3 py-1 text-xs font-bold text-white">Admin</span>
      </div>

      <div className="mb-6 inline-flex gap-1 rounded-xl bg-black/5 p-1 text-sm font-semibold">
        <TabBtn active={tab === 'aulas'} onClick={() => setTab('aulas')}>
          Aulas do roadmap
        </TabBtn>
        <TabBtn active={tab === 'pins'} onClick={() => setTab('pins')}>
          PINs de acesso
        </TabBtn>
      </div>

      {tab === 'aulas' ? <LessonsPanel /> : <PinsPanel />}
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

function LessonsPanel() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);

  async function load() {
    const res = await fetch('/api/portal/admin/lessons');
    const data = await res.json();
    if (res.ok) setLessons(data.lessons || []);
  }
  useEffect(() => {
    load();
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/portal/admin/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
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
        <LessonCard key={lesson.id} lesson={lesson} onChange={load} />
      ))}
    </div>
  );
}

function LessonCard({ lesson, onChange }: { lesson: Lesson; onChange: () => void }) {
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

          <MaterialsEditor lessonId={lesson.id} materials={materials} onChange={onChange} />
        </div>
      )}
    </div>
  );
}

function MaterialsEditor({
  lessonId,
  materials,
  onChange,
}: {
  lessonId: string;
  materials: Material[];
  onChange: () => void;
}) {
  const [kind, setKind] = useState('powerpoint');
  const [title, setTitle] = useState('');
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
