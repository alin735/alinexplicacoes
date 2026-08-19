'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Pop-up que convida o aluno a receber um email quando é publicado material
 * novo. Só é montado quando ainda não está inscrito e o convite não foi
 * dispensado há pouco tempo (ver `shouldAskNotify` em portal.ts).
 */
export default function NotifyPrompt({ nome }: { nome: string }) {
  const router = useRouter();
  const [aberto, setAberto] = useState(true);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [feito, setFeito] = useState(false);

  if (!aberto) return null;

  async function inscrever(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setLoading(true);
    try {
      const res = await fetch('/api/portal/notify-prefs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Não foi possível guardar.');
      setFeito(true);
      setTimeout(() => {
        setAberto(false);
        router.refresh();
      }, 1600);
    } catch (err: any) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function agoraNao() {
    setAberto(false);
    await fetch('/api/portal/notify-prefs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dismiss: true }),
    });
    router.refresh();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="notify-titulo"
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 p-4 sm:items-center"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        {feito ? (
          <div className="py-4 text-center">
            <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-emerald-50 text-2xl">
              ✓
            </div>
            <p className="font-bold">Combinado!</p>
            <p className="mt-1 text-sm text-black/55">
              Avisamos-te por email sempre que houver material novo.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-start gap-3">
              <span className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-full bg-black/5 text-2xl">
                🔔
              </span>
              <div>
                <h2 id="notify-titulo" className="text-lg font-extrabold tracking-tight">
                  Queres ser avisado, {nome}?
                </h2>
                <p className="mt-1 text-sm text-black/60">
                  Recebes um email quando publicarmos uma ficha de revisão, um teste ou os
                  materiais de uma aula.
                </p>
              </div>
            </div>

            <form onSubmit={inscrever} className="space-y-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="o.teu@email.com"
                className="w-full rounded-xl border border-black/15 px-4 py-2.5 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-black/10"
              />
              {erro && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-center text-sm text-red-600">{erro}</p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-black px-4 py-3 text-sm font-bold text-white transition hover:bg-black/85 disabled:opacity-50"
              >
                {loading ? 'A guardar…' : 'Quero ser avisado'}
              </button>
              <button
                type="button"
                onClick={agoraNao}
                className="w-full py-1 text-sm font-semibold text-black/45 hover:text-black/70"
              >
                Agora não
              </button>
            </form>

            <p className="mt-2 text-center text-xs text-black/40">
              Só usamos o email para isto. Podes cancelar quando quiseres.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
