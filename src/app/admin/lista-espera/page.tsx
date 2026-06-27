'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import { createClient } from '@/lib/supabase';

type Lead = {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  course: string | null;
  status: 'active' | 'contacted';
  notes: string | null;
  source: string | null;
  joined_at: string;
  updated_at: string;
};

// Etiquetas amigáveis para cada origem de inscrição.
const SOURCE_LABELS: Record<string, string> = {
  'correcao-prova-matematica-9-ano-2026': 'Correção 9.º ano',
  'segunda-fase-12-ano': 'Segunda fase 12.º ano',
};

function sourceKey(source: string | null) {
  return source || 'outros';
}

function sourceLabel(source: string | null) {
  const key = sourceKey(source);
  return SOURCE_LABELS[key] || 'Outra origem';
}

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

export default function AdminWaitlistPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<string>('all');
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  // Modal de mensagem por email.
  const [messageLead, setMessageLead] = useState<Lead | null>(null);
  const [subject, setSubject] = useState('Explicações Top - MatemáticaTop');
  const [messageBody, setMessageBody] = useState('');
  const [sending, setSending] = useState(false);
  const [modalFeedback, setModalFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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
      const res = await fetch('/api/admin/exam-waitlist', {
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

  const handleRemove = async (lead: Lead) => {
    if (!token) return;
    if (!window.confirm(`Remover ${lead.full_name || lead.email} da lista de espera?`)) return;
    setBusyId(lead.id);
    try {
      const res = await fetch(`/api/admin/exam-waitlist?id=${encodeURIComponent(lead.id)}`, {
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

  const handleToggleStatus = async (lead: Lead) => {
    if (!token) return;
    const next = lead.status === 'contacted' ? 'active' : 'contacted';
    setBusyId(lead.id);
    try {
      const res = await fetch('/api/admin/exam-waitlist', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: lead.id, status: next }),
      });
      if (res.ok) {
        setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, status: next } : l)));
      } else {
        const payload = await res.json().catch(() => ({}));
        setError(payload.error || 'Não foi possível atualizar.');
      }
    } finally {
      setBusyId(null);
    }
  };

  const openMessageModal = (lead: Lead) => {
    setMessageLead(lead);
    setSubject('Explicações Top - MatemáticaTop');
    setMessageBody('');
    setModalFeedback(null);
  };

  const handleSendMessage = async () => {
    if (!token || !messageLead) return;
    if (!messageBody.trim()) {
      setModalFeedback({ type: 'error', text: 'Escreve a mensagem.' });
      return;
    }
    setSending(true);
    setModalFeedback(null);
    try {
      const res = await fetch('/api/admin/exam-waitlist/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: messageLead.id, subject, message: messageBody }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setModalFeedback({ type: 'error', text: payload.error || 'Não foi possível enviar.' });
        setSending(false);
        return;
      }
      setLeads((prev) => prev.map((l) => (l.id === messageLead.id ? { ...l, status: 'contacted' } : l)));
      setModalFeedback({ type: 'success', text: 'Mensagem enviada por email ✅' });
      setMessageBody('');
    } catch {
      setModalFeedback({ type: 'error', text: 'Erro de ligação.' });
    } finally {
      setSending(false);
    }
  };

  // Separadores por origem: "Todas" + uma aba por cada origem presente nos dados.
  const tabs = useMemo(() => {
    const counts = new Map<string, number>();
    leads.forEach((l) => {
      const key = sourceKey(l.source);
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    const ordered = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
    return [
      { key: 'all', label: 'Todas', count: leads.length },
      ...ordered.map(([key, count]) => ({ key, label: SOURCE_LABELS[key] || 'Outra origem', count })),
    ];
  }, [leads]);

  const filtered = leads.filter((l) => {
    if (activeTab !== 'all' && sourceKey(l.source) !== activeTab) return false;
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      (l.full_name || '').toLowerCase().includes(q) ||
      l.email.toLowerCase().includes(q) ||
      (l.course || '').toLowerCase().includes(q) ||
      (l.phone || '').toLowerCase().includes(q)
    );
  });

  const activeCount = leads.filter((l) => l.status === 'active').length;

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="flex min-h-screen items-center justify-center bg-white">
          <p className="text-gray-500">A carregar…</p>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-white px-4 pb-16 pt-28">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <Link href="/admin" className="text-sm text-gray-500 underline underline-offset-4 hover:text-black">
                ← Voltar ao painel
              </Link>
              <h1 className="mt-2 text-2xl sm:text-3xl font-black text-[#000000]">Lista de espera - Explicações Top</h1>
              <p className="mt-1 text-sm text-gray-600">
                {leads.length} inscrições · {activeCount} por contactar
              </p>
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          <div className="mt-5 flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
                  activeTab === tab.key
                    ? 'bg-black text-white'
                    : 'border border-black/15 text-gray-600 hover:text-black'
                }`}
              >
                {tab.label} <span className="opacity-70">({tab.count})</span>
              </button>
            ))}
          </div>

          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Procurar por nome, email, curso ou telemóvel…"
            className="mt-3 w-full rounded-xl border border-black/15 bg-white px-4 py-2.5 text-sm focus:border-black focus:outline-none"
          />

          <div className="mt-4 overflow-x-auto rounded-2xl border border-black/15">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">Aluno</th>
                  <th className="px-4 py-3">Curso</th>
                  <th className="px-4 py-3">Origem</th>
                  <th className="px-4 py-3">Contacto</th>
                  <th className="px-4 py-3">Inscrição</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10">
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-gray-400">
                      Ainda não há inscrições.
                    </td>
                  </tr>
                )}
                {filtered.map((lead) => (
                  <tr key={lead.id} className="align-top">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-black">{lead.full_name || '-'}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{lead.course || '-'}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">
                        {sourceLabel(lead.source)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <a href={`mailto:${lead.email}`} className="block text-gray-700 underline underline-offset-2 hover:text-black">
                        {lead.email}
                      </a>
                      {lead.phone && <div className="text-gray-500">{lead.phone}</div>}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(lead.joined_at)}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(lead)}
                        disabled={busyId === lead.id}
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold transition ${
                          lead.status === 'contacted'
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                        }`}
                      >
                        {lead.status === 'contacted' ? 'Contactado' : 'Por contactar'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openMessageModal(lead)}
                          className="rounded-lg bg-black px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#1a1a1a]"
                        >
                          Email
                        </button>
                        {lead.phone && (
                          <a
                            href={waLink(lead.phone)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-lg bg-[#25D366] px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90"
                          >
                            WhatsApp
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemove(lead)}
                          disabled={busyId === lead.id}
                          className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                        >
                          Remover
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
      <Footer />

      {/* Modal de email */}
      {messageLead && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget && !sending) setMessageLead(null);
          }}
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-lg font-black text-black">
                Email para {messageLead.full_name || messageLead.email}
              </h3>
              <button
                type="button"
                onClick={() => !sending && setMessageLead(null)}
                aria-label="Fechar"
                className="rounded-lg p-1.5 text-gray-400 hover:bg-black/5 hover:text-black"
              >
                ✕
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">{messageLead.email}</p>

            <label className="mt-4 block text-xs font-semibold text-gray-700">Assunto</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="mt-1 w-full rounded-xl border border-black/15 px-3.5 py-2.5 text-sm focus:border-black focus:outline-none"
            />

            <label className="mt-3 block text-xs font-semibold text-gray-700">Mensagem</label>
            <textarea
              value={messageBody}
              onChange={(e) => setMessageBody(e.target.value)}
              rows={6}
              placeholder="Olá! Temos vaga para explicações de…"
              className="mt-1 w-full rounded-xl border border-black/15 px-3.5 py-2.5 text-sm focus:border-black focus:outline-none"
            />

            {modalFeedback && (
              <p className={`mt-2 text-sm ${modalFeedback.type === 'error' ? 'text-red-600' : 'text-green-700'}`}>
                {modalFeedback.text}
              </p>
            )}

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => !sending && setMessageLead(null)}
                className="rounded-xl border border-black/15 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-black/5"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSendMessage}
                disabled={sending}
                className="rounded-xl bg-black px-5 py-2.5 text-sm font-bold text-white hover:bg-[#1a1a1a] disabled:opacity-60"
              >
                {sending ? 'A enviar…' : 'Enviar email'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
