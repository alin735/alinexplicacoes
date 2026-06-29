'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { COURSES, hasJoinedWaitlist, markJoinedWaitlist } from '@/components/correcao/waitlist-utils';

const SOURCE = 'explicacoes-top';

export default function WaitlistForm() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [course, setCourse] = useState(COURSES[0]);

  const [submitting, setSubmitting] = useState(false);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Se a pessoa já entrou na lista neste dispositivo, mostra logo a confirmação.
  useEffect(() => {
    setJoined(hasJoinedWaitlist());
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('Indica um email válido para entrares na lista de espera.');
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
          source: SOURCE,
        }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(payload.error || 'Não foi possível inscrever-te. Tenta novamente.');
        setSubmitting(false);
        return;
      }
      markJoinedWaitlist();
      setJoined(true);
    } catch {
      setError('Erro de ligação. Tenta novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  if (joined) {
    return (
      <div className="rounded-2xl border-2 border-[#16a34a]/30 bg-[#f0fdf4] p-6 sm:p-8 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#16a34a] text-2xl text-white">
          ✓
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-[#15803d]">Já estás na lista de espera!</h2>
        <p className="mt-2 text-sm sm:text-base text-[#15803d]/90 max-w-md mx-auto">
          Obrigado por te inscreveres nas Explicações Top. Assim que abrirmos as vagas, és das
          primeiras pessoas a saber, por email.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-black/15 bg-white p-6 sm:p-8 shadow-sm space-y-3">
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

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-xl bg-[#000000] px-5 py-3 text-base font-bold text-white transition hover:bg-[#1a1a1a] disabled:opacity-60"
      >
        {submitting ? 'A inscrever…' : 'Entrar na lista de espera →'}
      </button>

      <p className="text-center text-xs text-gray-400">Inscreveres-te é gratuito e sem compromisso.</p>
    </form>
  );
}
