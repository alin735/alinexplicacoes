'use client';

import { useState } from 'react';
import Link from 'next/link';

const AUDIENCE_LABEL: Record<string, string> = {
  newsletter: 'newsletter da MatemáticaTop',
  'exam-waitlist': 'lista de espera das Explicações Top',
  'matematica-a-waitlist': 'lista de espera das Explicações de Matemática A',
  'group-classes-waitlist': 'lista de espera das aulas de grupo',
};

export default function UnsubscribeClient({ token }: { token: string }) {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>(
    token ? 'idle' : 'error',
  );
  const [message, setMessage] = useState(
    token ? '' : 'Este link de cancelamento não é válido.',
  );
  const [audience, setAudience] = useState('');

  const handleUnsubscribe = async () => {
    setState('loading');
    try {
      const response = await fetch('/api/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Não foi possível cancelar a subscrição.');
      }
      setAudience(String(payload.audience || ''));
      setState('done');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível cancelar a subscrição.');
      setState('error');
    }
  };

  const label = AUDIENCE_LABEL[audience] || 'lista';

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm border border-gray-100 text-center">
        {state === 'done' ? (
          <>
            <h1 className="text-xl font-bold text-black">Subscrição cancelada</h1>
            <p className="mt-3 text-sm text-gray-600 leading-relaxed">
              Deixas de receber emails da {label}. Se mudares de ideias, é só voltares a
              inscrever-te no site.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-xl font-bold text-black">Queres cancelar a subscrição?</h1>
            <p className="mt-3 text-sm text-gray-600 leading-relaxed">
              Deixas de receber os emails desta lista. As outras inscrições que tenhas na
              MatemáticaTop mantêm-se.
            </p>
            {state === 'error' && (
              <p className="mt-4 text-sm text-red-600">{message}</p>
            )}
            <button
              type="button"
              onClick={handleUnsubscribe}
              disabled={!token || state === 'loading'}
              className="mt-6 w-full rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {state === 'loading' ? 'A cancelar...' : 'Cancelar subscrição'}
            </button>
          </>
        )}
        <Link
          href="/"
          className="mt-5 inline-block text-sm text-gray-500 underline hover:text-black"
        >
          Voltar a matematica.top
        </Link>
      </div>
    </main>
  );
}
