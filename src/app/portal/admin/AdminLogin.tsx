'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/portal/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Código incorreto.');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm pt-6">
      <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-extrabold">Acesso de administração</h1>
        <p className="mt-1 text-sm text-black/55">Introduz o código de admin do portal.</p>
        <form onSubmit={submit} className="mt-5 space-y-3">
          <input
            type="password"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Código de admin"
            required
            className="w-full rounded-xl border border-black/15 px-4 py-2.5 text-sm outline-none focus:border-black focus:ring-2 focus:ring-black/10"
          />
          <button
            disabled={loading}
            className="w-full rounded-xl bg-black px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
          >
            {loading ? 'A entrar…' : 'Entrar'}
          </button>
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-center text-sm text-red-600">{error}</p>
          )}
        </form>
      </div>
    </div>
  );
}
