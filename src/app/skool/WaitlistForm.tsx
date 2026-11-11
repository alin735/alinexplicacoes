'use client';

import { useState } from 'react';
import { BOTAO_PRINCIPAL } from '@/components/ui';
import { CampoArmadilha, useAntiBot } from '@/components/CampoArmadilha';

const ANOS = ['10º', '11º', '12º', 'Outro'] as const;

const CAMPO =
  'w-full rounded-2xl border border-black/15 bg-[#fafafa] px-4 py-3 text-sm text-[#111111] ' +
  'outline-none transition-all focus:border-[#111111] focus:ring-2 focus:ring-[#111111]/20';

export default function WaitlistForm() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [schoolYear, setSchoolYear] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [warning, setWarning] = useState('');
  const [error, setError] = useState('');
  const antiBot = useAntiBot();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/skool-waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, schoolYear, ...antiBot.campos() }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload?.error || 'Não foi possível entrar na lista de espera.');
      }

      setWarning(payload?.warning || '');
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível entrar na lista de espera.');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="rounded-2xl border border-black/15 bg-white p-6 text-center shadow-sm">
        <p className="text-2xl" aria-hidden>
          ✅
        </p>
        <h2 className="mt-3 text-xl font-black text-[#000000]">Estás dentro.</h2>
        <p className="mt-2 text-sm leading-relaxed text-gray-600">
          Vais receber um email a confirmar e aviso-te assim que o Rumo ao 20 abrir.
        </p>
        {warning && (
          <p className="mt-4 rounded-xl border border-[#f59e0b]/40 bg-[#fff7ed] px-4 py-3 text-xs text-[#b45309]">
            {warning}
          </p>
        )}
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="relative rounded-2xl border border-black/15 bg-white p-6 shadow-sm"
    >
      <CampoArmadilha inputRef={antiBot.armadilha} />
      <h2 className="text-xl font-black text-[#000000]">Entrar na lista de espera</h2>

      <div className="mt-5 space-y-4">
        <div>
          <label htmlFor="skool-nome" className="mb-1.5 block text-sm font-medium text-gray-700">
            Nome
          </label>
          <input
            id="skool-nome"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            autoComplete="name"
            className={CAMPO}
          />
        </div>

        <div>
          <label htmlFor="skool-email" className="mb-1.5 block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            id="skool-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className={CAMPO}
          />
        </div>

        <div>
          <label htmlFor="skool-ano" className="mb-1.5 block text-sm font-medium text-gray-700">
            Ano que frequentas
          </label>
          <select
            id="skool-ano"
            value={schoolYear}
            onChange={(e) => setSchoolYear(e.target.value)}
            className={CAMPO}
          >
            <option value="">Escolhe o teu ano</option>
            {ANOS.map((ano) => (
              <option key={ano} value={ano}>
                {ano}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      )}

      <button type="submit" disabled={submitting} className={`${BOTAO_PRINCIPAL} mt-5 w-full`}>
        {submitting ? 'A entrar...' : 'Entrar na lista de espera'}
      </button>

      <p className="mt-4 text-center text-xs leading-relaxed text-gray-500">
        Uso o teu email só para te avisar sobre o Rumo ao 20. Sais da lista quando quiseres, com um
        clique no fim de qualquer email.
      </p>
    </form>
  );
}
