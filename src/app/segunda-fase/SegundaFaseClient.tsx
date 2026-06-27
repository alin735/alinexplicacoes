'use client';

import { useState } from 'react';

const SOURCE = 'segunda-fase-12-ano';

export default function SegundaFaseClient() {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
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
          source: SOURCE,
        }),
      });
      const payload = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(payload.error || 'Não foi possível inscrever-te. Tenta novamente.');
        setSubmitting(false);
        return;
      }

      setDone(true);
    } catch {
      setError('Erro de ligação. Tenta novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="rounded-2xl border border-[#16a34a]/30 bg-[#f0fdf4] p-8 text-center shadow-sm">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#16a34a] text-2xl text-white">
          ✓
        </div>
        <h2 className="text-2xl font-black text-[#15803d]">Estás na lista de espera!</h2>
        <p className="mt-2 text-[#166534]">
          Assim que abrirmos a preparação para a segunda fase, és das primeiras pessoas a saber. Vê o
          teu email para a confirmação.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-black/15 bg-white p-6 sm:p-8 shadow-sm space-y-3">
      <input
        type="text"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        placeholder="O teu nome"
        className="w-full rounded-xl border border-black/15 bg-white px-3.5 py-3 text-sm focus:border-black focus:outline-none"
      />
      <input
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="Telemóvel (opcional)"
        className="w-full rounded-xl border border-black/15 bg-white px-3.5 py-3 text-sm focus:border-black focus:outline-none"
      />
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="O teu email"
        className="w-full rounded-xl border border-black/15 bg-white px-3.5 py-3 text-sm focus:border-black focus:outline-none"
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-2xl bg-[#000000] px-7 py-4 text-lg font-black text-white shadow-lg shadow-black/25 transition hover:bg-[#1a1a1a] hover:scale-[1.01] disabled:opacity-60 disabled:hover:scale-100"
      >
        {submitting ? 'A inscrever…' : 'Entrar na lista de espera →'}
      </button>
    </form>
  );
}
