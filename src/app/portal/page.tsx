'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Mode = 'entrar' | 'inscrever';

export default function PortalLandingPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('entrar');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [pin2, setPin2] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleEntrar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/portal/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), pin: pin.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Não foi possível entrar.');
      router.push('/roadmap');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleInscrever(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (pin.trim() !== pin2.trim()) {
      setError('Os PINs pessoais não coincidem.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/portal/redeem-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim(), name: name.trim(), pin: pin.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Erro ao validar o PIN.');
      router.push('/roadmap');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md pt-4">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-extrabold tracking-tight">O teu portal de revisões</h1>
        <p className="mt-1 text-sm text-black/55">
          Época especial de Matemática A. Acede ao teu roadmap de aulas, materiais e fichas.
        </p>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-black/5 p-1 text-sm font-semibold">
        <button
          onClick={() => {
            setMode('entrar');
            setError(null);
          }}
          className={`rounded-lg px-3 py-2 transition ${
            mode === 'entrar' ? 'bg-white shadow-sm' : 'text-black/50'
          }`}
        >
          Já tenho conta
        </button>
        <button
          onClick={() => {
            setMode('inscrever');
            setError(null);
          }}
          className={`rounded-lg px-3 py-2 transition ${
            mode === 'inscrever' ? 'bg-white shadow-sm' : 'text-black/50'
          }`}
        >
          Tenho um PIN
        </button>
      </div>

      <div className="rounded-2xl border border-black/15 bg-white p-6 shadow-sm">
        {mode === 'entrar' ? (
          <form onSubmit={handleEntrar} className="space-y-4">
            <Field label="O teu nome" value={name} onChange={setName} placeholder="Nome próprio" required />
            <Field
              label="PIN pessoal"
              type="password"
              value={pin}
              onChange={setPin}
              placeholder="O PIN que escolheste"
              required
            />
            <SubmitButton loading={loading}>Entrar</SubmitButton>
            <p className="text-center text-xs text-black/45">
              É o PIN que definiste na inscrição. O teu acesso fica guardado neste dispositivo.
            </p>
          </form>
        ) : (
          <form onSubmit={handleInscrever} className="space-y-4">
            <Field
              label="PIN de convite"
              value={code}
              onChange={setCode}
              placeholder="Ex.: 4F8K-2Q"
              required
            />
            <Field label="O teu nome" value={name} onChange={setName} placeholder="Nome próprio" required />
            <Field
              label="Cria um PIN pessoal"
              type="password"
              value={pin}
              onChange={setPin}
              placeholder="Mínimo 4 caracteres"
              required
            />
            <Field
              label="Confirma o PIN pessoal"
              type="password"
              value={pin2}
              onChange={setPin2}
              placeholder="Repete o PIN"
              required
            />
            <SubmitButton loading={loading}>Inscrever-me</SubmitButton>
            <p className="text-center text-xs text-black/45">
              O PIN de convite só funciona uma vez. Depois entras sempre com o teu nome e PIN pessoal.
            </p>
          </form>
        )}

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-center text-sm text-red-600">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-black/45">
        {label}
      </span>
      <input
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-black/15 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-black/10"
      />
    </label>
  );
}

function SubmitButton({ loading, children }: { loading: boolean; children: React.ReactNode }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full rounded-xl bg-black px-4 py-3 text-sm font-bold text-white transition hover:bg-black/85 disabled:opacity-50"
    >
      {loading ? 'A processar…' : children}
    </button>
  );
}
