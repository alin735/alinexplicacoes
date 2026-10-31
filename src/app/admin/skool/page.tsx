'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { createClient } from '@/lib/supabase';

type Estado = 'active' | 'contacted' | 'joined';

type Lead = {
  id: string;
  full_name: string | null;
  email: string;
  school_year: string | null;
  status: Estado;
  founding_member: boolean;
  joined_at: string;
  updated_at: string;
};

const ANOS = ['10º', '11º', '12º', 'Outro'] as const;

/** Quantos lugares de membro fundador existem ao todo. */
const LUGARES_FUNDADOR = 20;

const DEFAULT_SUBJECT = 'O Rumo ao 20 já abriu 🚀';
const DEFAULT_MESSAGE =
  'O Rumo ao 20 já está aberto!\n\n' +
  'Como estavas na lista de espera, estou a avisar-te em primeira mão. Os 20 primeiros a entrar ficam como membros fundadores, a 19 €/mês em vez de 29 €, enquanto forem membros.\n\n' +
  'Entra aqui: matematica.top/20\n\n' +
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

export default function AdminSkoolPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filtroAno, setFiltroAno] = useState<string>('');

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
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', activeUser.id)
        .single();
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
      const res = await fetch('/api/admin/skool-waitlist', {
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
  const entraram = leads.filter((l) => l.status === 'joined').length;
  const fundadores = leads.filter((l) => l.founding_member).length;
  const porAno = ANOS.map((ano) => ({
    ano,
    total: leads.filter((l) => l.school_year === ano).length,
  }));
  const semAno = leads.filter((l) => !l.school_year).length;

  const visiveis = filtroAno ? leads.filter((l) => l.school_year === filtroAno) : leads;

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
      const res = await fetch('/api/admin/skool-waitlist', {
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

  const atualizarLead = async (
    lead: Lead,
    alteracoes: { status?: Estado; foundingMember?: boolean },
  ) => {
    if (!token) return;
    setBusyId(lead.id);
    try {
      const res = await fetch('/api/admin/skool-waitlist', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: lead.id, ...alteracoes }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(payload.error || 'Não foi possível atualizar.');
        return;
      }
      setLeads((prev) => prev.map((l) => (l.id === lead.id ? (payload.lead as Lead) : l)));
    } catch {
      setError('Erro de ligação ao atualizar.');
    } finally {
      setBusyId(null);
    }
  };

  const handleRemove = async (lead: Lead) => {
    if (!token) return;
    if (!window.confirm(`Remover ${lead.full_name || lead.email} da lista?`)) return;
    setBusyId(lead.id);
    try {
      const res = await fetch(`/api/admin/skool-waitlist?id=${encodeURIComponent(lead.id)}`, {
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-black text-[#111]">Lista de espera | Rumo ao 20</h1>
          <span className="text-sm text-gray-500">
            {leads.length} inscrito(s) | {activos} por avisar
          </span>
        </div>

        {error && (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        {/* Contagens */}
        <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-black/15 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Na lista</p>
            <p className="mt-1 text-2xl font-black text-[#111]">{leads.length}</p>
          </div>
          <div className="rounded-2xl border border-black/15 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Já avisados</p>
            <p className="mt-1 text-2xl font-black text-[#111]">{leads.length - activos}</p>
          </div>
          <div className="rounded-2xl border border-black/15 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Entraram</p>
            <p className="mt-1 text-2xl font-black text-[#111]">{entraram}</p>
          </div>
          <div className="rounded-2xl border border-black/15 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Fundadores</p>
            <p className="mt-1 text-2xl font-black text-[#111]">
              {fundadores}
              <span className="text-base font-bold text-gray-400"> / {LUGARES_FUNDADOR}</span>
            </p>
          </div>
        </section>

        {/* Composição por ano */}
        <section className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setFiltroAno('')}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
              filtroAno === '' ? 'border-black bg-[#111] text-white' : 'border-black/15 bg-white text-[#111]'
            }`}
          >
            Todos ({leads.length})
          </button>
          {porAno.map(({ ano, total }) => (
            <button
              key={ano}
              type="button"
              onClick={() => setFiltroAno(filtroAno === ano ? '' : ano)}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
                filtroAno === ano ? 'border-black bg-[#111] text-white' : 'border-black/15 bg-white text-[#111]'
              }`}
            >
              {ano} ({total})
            </button>
          ))}
          {semAno > 0 && (
            <span className="rounded-full border border-black/15 bg-white px-3.5 py-1.5 text-xs font-semibold text-gray-500">
              sem ano ({semAno})
            </span>
          )}
        </section>

        {/* Avisar a lista */}
        <section className="mt-6 rounded-2xl border border-black/15 bg-white p-5">
          <h2 className="text-sm font-black text-[#111]">Avisar a lista de espera</h2>
          <p className="mt-1 text-xs text-gray-500">
            Envia um email a toda a lista de uma vez, por exemplo quando abrires a comunidade.
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
              rows={7}
              placeholder="Mensagem"
              className="w-full rounded-xl border border-black/15 px-3.5 py-2.5 text-sm outline-none focus:border-black"
            />
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={onlyActive}
                onChange={(e) => setOnlyActive(e.target.checked)}
                className="h-4 w-4 accent-black"
              />
              Enviar só a quem ainda não foi avisado ({activos})
            </label>
            {feedback && (
              <p className={`text-sm ${feedback.type === 'error' ? 'text-red-600' : 'text-green-700'}`}>
                {feedback.text}
              </p>
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
          {visiveis.length === 0 && (
            <p className="rounded-2xl border border-black/15 bg-white p-8 text-center text-gray-500">
              {leads.length === 0 ? 'Ainda não há inscrições.' : 'Ninguém neste ano.'}
            </p>
          )}
          {visiveis.map((lead) => (
            <div
              key={lead.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-black/15 bg-white p-4"
            >
              <div>
                <p className="font-bold text-[#111]">
                  {lead.full_name || lead.email}
                  {lead.founding_member && (
                    <span className="ml-2 rounded-full bg-[#fff7ed] px-2 py-0.5 text-[11px] font-semibold text-[#b45309]">
                      fundador
                    </span>
                  )}
                  {lead.status === 'joined' && (
                    <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                      entrou
                    </span>
                  )}
                  {lead.status === 'contacted' && (
                    <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600">
                      avisado
                    </span>
                  )}
                </p>
                <p className="text-sm text-gray-500">
                  {lead.email}
                  {lead.school_year ? ` | ${lead.school_year}` : ''} | {formatDate(lead.joined_at)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() =>
                    atualizarLead(lead, { status: lead.status === 'joined' ? 'contacted' : 'joined' })
                  }
                  disabled={busyId === lead.id}
                  className="text-sm font-semibold text-[#111] hover:underline disabled:opacity-50"
                >
                  {lead.status === 'joined' ? 'Anular entrada' : 'Marcar como entrou'}
                </button>
                <button
                  onClick={() => atualizarLead(lead, { foundingMember: !lead.founding_member })}
                  disabled={busyId === lead.id}
                  className="text-sm font-semibold text-[#b45309] hover:underline disabled:opacity-50"
                >
                  {lead.founding_member ? 'Tirar fundador' : 'Marcar fundador'}
                </button>
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
