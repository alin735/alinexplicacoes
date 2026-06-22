'use client';

import { useEffect, useState } from 'react';
import { COURSES, markJoinedWaitlist } from './waitlist-utils';

type Mode = 'funnel' | 'waitlist';

type Props = {
  open: boolean;
  mode: Mode;
  onClose: () => void;
  // Chamado após a pessoa entrar na lista de espera com sucesso.
  onJoined: () => void;
  // Apenas no modo "funnel": seguir para o enunciado sem entrar na lista.
  onSkip?: () => void;
};

export default function WaitlistModal({ open, mode, onClose, onJoined, onSkip }: Props) {
  const [joinWaitlist, setJoinWaitlist] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [course, setCourse] = useState(COURSES[0]);

  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fecha o modal com Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const join = async () => {
    setFeedback(null);
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setFeedback({ type: 'error', text: 'Indica um email válido para entrares na lista de espera.' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/exam-waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim() || null,
          email: trimmedEmail,
          phone: phone.trim() || null,
          course,
        }),
      });
      const payload = await res.json().catch(() => ({}));

      if (!res.ok) {
        setFeedback({ type: 'error', text: payload.error || 'Não foi possível inscrever-te. Tenta novamente.' });
        setSubmitting(false);
        return;
      }

      // Guarda neste dispositivo para não voltar a pedir a inscrição.
      markJoinedWaitlist();
      onJoined();
    } catch {
      setFeedback({ type: 'error', text: 'Erro de ligação. Tenta novamente.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrimary = async () => {
    if (mode === 'waitlist') {
      await join();
      return;
    }
    // Modo funnel: só inscreve se a opção estiver assinalada; caso contrário segue direto.
    if (joinWaitlist) {
      await join();
    } else {
      onSkip?.();
    }
  };

  const primaryLabel =
    mode === 'waitlist'
      ? submitting
        ? 'A inscrever…'
        : 'Entrar na lista de espera →'
      : submitting
        ? 'A inscrever…'
        : 'Seguir para o enunciado →';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#f59e0b]/40 bg-[#fff7ed] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#b45309]">
              Novidade
            </span>
            <h3 className="mt-3 text-xl font-black text-[#000000]">As Explicações Top estão a chegar 🚀</h3>
            <p className="mt-2 text-sm text-gray-600">
              Vamos abrir explicações de qualidade para praticamente todas as disciplinas, a um preço
              acessível. Entra na lista de espera e és das primeiras pessoas a saber.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="-mr-1 -mt-1 rounded-lg p-1.5 text-gray-400 transition hover:bg-black/5 hover:text-black"
          >
            ✕
          </button>
        </div>

        <div className="mt-5 space-y-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-700">Curso</label>
            <select
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              className="w-full rounded-xl border border-black/15 bg-white px-3.5 py-2.5 text-sm focus:border-black focus:outline-none"
            >
              {COURSES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="O teu nome"
            className="w-full rounded-xl border border-black/15 bg-white px-3.5 py-2.5 text-sm focus:border-black focus:outline-none"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="O teu email"
            className="w-full rounded-xl border border-black/15 bg-white px-3.5 py-2.5 text-sm focus:border-black focus:outline-none"
          />
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Telemóvel (opcional)"
            className="w-full rounded-xl border border-black/15 bg-white px-3.5 py-2.5 text-sm focus:border-black focus:outline-none"
          />

          {mode === 'funnel' && (
            <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-black/10 bg-gray-50 p-3">
              <input
                type="checkbox"
                checked={joinWaitlist}
                onChange={(e) => setJoinWaitlist(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-black"
              />
              <span className="text-sm text-gray-700">
                Sim, quero entrar na lista de espera das Explicações Top.
              </span>
            </label>
          )}

          {feedback && (
            <p className={`text-sm ${feedback.type === 'error' ? 'text-red-600' : 'text-green-700'}`}>
              {feedback.text}
            </p>
          )}

          <button
            type="button"
            onClick={handlePrimary}
            disabled={submitting}
            className="w-full rounded-xl bg-[#000000] px-5 py-3 text-base font-bold text-white transition hover:bg-[#1a1a1a] disabled:opacity-60"
          >
            {primaryLabel}
          </button>

          {mode === 'funnel' && (
            <p className="text-center text-xs text-gray-400">
              Para seres avisado quando abrirmos as Explicações Top, assinala a opção acima. Para ver
              já o enunciado, basta clicares no botão.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
