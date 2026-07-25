'use client';

import { useEffect, useState, type FormEvent } from 'react';

const FLAG = 'mt_matematica_a_waitlist';

const campo = 'w-full rounded-xl border border-black/15 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-black';

export default function WaitlistForm() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      if (localStorage.getItem(FLAG) === 'true') setJoined(true);
    } catch {
      // ignora
    }
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
      const res = await fetch('/api/matematica-a-waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim() || null,
          email: trimmedEmail,
          phone: phone.trim() || null,
        }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(payload.error || 'Não foi possível inscrever-te. Tenta novamente.');
        setSubmitting(false);
        return;
      }
      try {
        localStorage.setItem(FLAG, 'true');
      } catch {
        // ignora
      }
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
          Obrigado. Assim que abrir as vagas das explicações de Matemática A, aviso-te por email.
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
        className={campo}
      />
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="O teu email"
        className={campo}
      />
      <input
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="Telemóvel (opcional)"
        className={campo}
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
