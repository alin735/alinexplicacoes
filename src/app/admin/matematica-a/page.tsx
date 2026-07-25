'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { createClient } from '@/lib/supabase';

type Lead = {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  status: 'active' | 'contacted';
  created_at: string;
  updated_at: string;
};

const DEFAULT_SUBJECT = 'As explicações de Matemática A vão abrir 🎉';
const DEFAULT_MESSAGE =
  'As vagas para as explicações de Matemática A já vão abrir!\n\n' +
  'Como estavas na lista de espera, estou a avisar-te em primeira mão. Responde a este email ou fala comigo para garantires o teu lugar.\n\n' +
  'Até já,\nAlin';

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return value;
  }
}

function waLink(phone: string) {
  const digits = phone.replace(/[^\d]/g, '');
  const normalized = digits.startsWith('351') ? digits : `351${digits}`;
  return `https://wa.me/${normalized}`;
}

export default function AdminMatematicaAPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const [subject, setSubject] = useState(DEFAULT_SUBJECT);
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const [onlyActive, setOnlyActive] = useState(true);
  const [broadcasting, setBroadcasting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const activeUser = sessionData.session?.user ?? null;
      const accessToken = sessionData.session?.access_token ?? null;
      if (!activeUser || !accessToken) {
        router.push('/login');
        return;
      }
      const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', activeUser.id).single();
      if (!profile?.is_admin) {
        router.push('/');
        return;
      }
      setToken(accessToken);
      await loadLeads(accessToken);
      setLoading(false);
    };
    void init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, supabase]);

  const loadLeads = async (accessToken: string) => {
    setError('');
    try {
      const res = await fetch('/api/admin/matematica-a-waitlist', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(payload.error || 'Não foi possível carregar a lista.');
        return;
      }
      setLeads(payload.leads || []);
    } catch {
      setError('Erro de ligação ao carregar a lista.');
    }
  };

  const activos = leads.filter((l) => l.status === 'active').length;

  const handleBroadcast = async () => {
    if (!token) return;
    if (!subject.trim() || !message.trim()) {
      setFeedback({ type: 'error', text: 'Preenche o assunto e a mensagem.' });
      return;
    }
    const alvo = onlyActive ? activos : leads.length;
    if (alvo === 0) {
      setFeedback({ type: 'error', text: 'Não há destinatários para enviar.' });
      return;
    }
    if (!window.confirm(`Enviar este email a ${alvo} pessoa(s) da lista?`)) return;

    setBroadcasting(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/admin/matematica-a-waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ subject, message, onlyActive }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFeedback({ type: 'error', text: payload.error || 'Não foi possível enviar.' });
        setBroadcasting(false);
        return;
      }
      setFeedback({
        type: 'success',
        text: `Enviado a ${payload.sent} pessoa(s)${payload.failed ? `, ${payload.failed} falhou/falharam` : ''}. ✅`,
      });
      await loadLeads(token);
    } catch {
      setFeedback({ type: 'error', text: 'Erro de ligação ao enviar.' });
    } finally {
      setBroadcasting(false);
    }
  };

  const handleRemove = async (lead: Lead) => {
    if (!token) return;
    if (!window.confirm(`Remover ${lead.full_name || lead.email} da lista?`)) return;
    setBusyId(lead.id);
    try {
      const res = await fetch(`/api/admin/matematica-a-waitlist?id=${encodeURIComponent(lead.id)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setLeads((prev) => prev.filter((l) => l.id !== lead.id));
      } else {
        const payload = await res.json().catch(() => ({}));
        setError(payload.error || 'Não foi possível remover.');
      }
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-4xl px-4 py-32 text-center text-gray-500">A carregar...</main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 pb-16 pt-28">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black text-[#111]">Lista de espera · Matemática A</h1>
          <span className="text-sm text-gray-500">
            {leads.length} inscrito(s) · {activos} por avisar
          </span>
        </div>

        {error && <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        {/* Broadcast */}
        <section className="mt-6 rounded-2xl border border-black/10 bg-white p-5">
          <h2 className="text-sm font-black text-[#111]">Avisar a lista de espera</h2>
          <p className="mt-1 text-xs text-gray-500">
            Envia um email a toda a lista de uma vez (ex.: quando abrires as vagas).
          </p>
          <div className="mt-4 space-y-3">
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Assunto"
              className="w-full rounded-xl border border-black/15 px-3.5 py-2.5 text-sm outline-none focus:border-black"
            />
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              placeholder="Mensagem"
              className="w-full rounded-xl border border-black/15 px-3.5 py-2.5 text-sm outline-none focus:border-black"
            />
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={onlyActive} onChange={(e) => setOnlyActive(e.target.checked)} className="h-4 w-4 accent-black" />
              Enviar só a quem ainda não foi avisado ({activos})
            </label>
            {feedback && (
              <p className={`text-sm ${feedback.type === 'error' ? 'text-red-600' : 'text-green-700'}`}>{feedback.text}</p>
            )}
            <button
              type="button"
              onClick={handleBroadcast}
              disabled={broadcasting}
              className="rounded-xl bg-[#111] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-black disabled:opacity-60"
            >
              {broadcasting ? 'A enviar…' : `Enviar a todos (${onlyActive ? activos : leads.length})`}
            </button>
          </div>
        </section>

        {/* Lista */}
        <section className="mt-6 space-y-2">
          {leads.length === 0 && (
            <p className="rounded-2xl border border-black/10 bg-white p-8 text-center text-gray-500">
              Ainda não há inscrições.
            </p>
          )}
          {leads.map((lead) => (
            <div key={lead.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-black/10 bg-white p-4">
              <div>
                <p className="font-bold text-[#111]">
                  {lead.full_name || lead.email}
                  {lead.status === 'contacted' && (
                    <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                      avisado
                    </span>
                  )}
                </p>
                <p className="text-sm text-gray-500">
                  {lead.email}
                  {lead.phone ? ` · ${lead.phone}` : ''} · {formatDate(lead.created_at)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {lead.phone && (
                  <a
                    href={waLink(lead.phone)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-[#25D366] hover:underline"
                  >
                    WhatsApp
                  </a>
                )}
                <button
                  onClick={() => handleRemove(lead)}
                  disabled={busyId === lead.id}
                  className="text-sm font-semibold text-red-600 hover:underline disabled:opacity-50"
                >
                  Remover
                </button>
              </div>
            </div>
          ))}
        </section>
      </main>
      <Footer />
    </>
  );
}
