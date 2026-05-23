'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PreparacaoCalendar from '@/components/PreparacaoCalendar';
import { createClient } from '@/lib/supabase';
import {
  GROUP_CLASS_PACKAGES,
  GROUP_CLASS_SCHOOL_YEAR,
  type GroupClassLesson,
  type GroupClassPackageId,
} from '@/lib/group-classes';

// ─── Inner component (needs useSearchParams) ──────────────────────────────────

function SelecionarContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();

  const rawPacote = searchParams.get('pacote') as GroupClassPackageId | null;
  const packageId: GroupClassPackageId =
    rawPacote === 'intermedio' || rawPacote === 'avulsa' ? rawPacote : 'avulsa';

  const pkg = GROUP_CLASS_PACKAGES[packageId];
  const maxSelections = packageId === 'intermedio' ? 7 : 1;

  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectedLessons, setSelectedLessons] = useState<GroupClassLesson[]>([]);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const check = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user ?? null);
      setAuthLoading(false);
    };
    void check();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e: any, s: any) => {
      setUser(s?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleToggle = (lesson: GroupClassLesson) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(lesson.date)) {
        next.delete(lesson.date);
      } else {
        if (next.size >= maxSelections) return prev;
        next.add(lesson.date);
      }
      return next;
    });
    setSelectedLessons((prev) => {
      const dates = new Set(prev.map((l) => l.date));
      if (dates.has(lesson.date)) {
        return prev.filter((l) => l.date !== lesson.date);
      } else {
        if (prev.length >= maxSelections) return prev;
        return [...prev, lesson].sort((a, b) => a.date.localeCompare(b.date));
      }
    });
  };

  const handleCheckout = async () => {
    setError('');

    if (!user) {
      const next = encodeURIComponent(`/preparacao/selecionar?pacote=${packageId}`);
      router.push(`/login?next=${next}`);
      return;
    }

    if (selected.size !== maxSelections) return;

    setCheckoutLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) throw new Error('Sessão inválida. Volta a iniciar sessão.');

      const response = await fetch('/api/checkout/group-classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          schoolYear: GROUP_CLASS_SCHOOL_YEAR,
          packageId,
          selectedLessons: selectedLessons.map((l) => ({
            id: l.id,
            date: l.date,
            time: l.time,
            topic: l.topic,
          })),
        }),
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Erro ao criar pagamento.');
      window.location.href = payload.url;
    } catch (err: any) {
      setError(err.message || 'Erro ao iniciar pagamento. Tenta novamente.');
      setCheckoutLoading(false);
    }
  };

  const remaining = maxSelections - selected.size;

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#f5f5f5]">
        {/* Header */}
        <div className="bg-white border-b border-black/10 px-4 pt-28 pb-10">
          <div className="max-w-5xl mx-auto">
            <Link
              href="/preparacao#pacotes"
              className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#000000] mb-6 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Voltar aos pacotes
            </Link>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#5a7ca8] mb-2">
              {pkg.title} · {pkg.priceLabel}
            </p>
            <h1 className="text-3xl sm:text-4xl font-black text-[#000000] leading-none">
              {packageId === 'intermedio'
                ? 'Escolhe as 7 aulas que queres'
                : 'Escolhe a aula que queres'}
            </h1>
            <p className="text-gray-500 mt-2 text-sm">
              {packageId === 'intermedio'
                ? 'Seleciona exatamente 7 aulas. Podes focar-te nos temas onde tens mais dificuldade.'
                : 'Seleciona 1 aula da tua preferência.'}
            </p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-10">
          <div className="grid lg:grid-cols-[1fr_340px] gap-8 items-start">
            {/* Calendar */}
            <div className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-[0_24px_60px_rgba(0,0,0,0.06)]">
              <PreparacaoCalendar
                mode="select"
                maxSelections={maxSelections}
                selected={selected}
                onToggle={handleToggle}
              />
            </div>

            {/* Summary panel */}
            <div className="space-y-4 lg:sticky lg:top-28">
              {/* Counter */}
              <div className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-[0_24px_60px_rgba(0,0,0,0.06)]">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#5a7ca8] mb-3">
                  Seleção
                </p>
                <div className="flex items-end gap-2 mb-4">
                  <span className="text-5xl font-black text-[#000000] leading-none">{selected.size}</span>
                  <span className="text-xl font-black text-gray-300 leading-none mb-1">/ {maxSelections}</span>
                </div>
                <div className="w-full bg-[#f5f5f5] rounded-full h-2 mb-4">
                  <div
                    className="bg-[#000000] h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(selected.size / maxSelections) * 100}%` }}
                  />
                </div>
                <p className="text-sm text-gray-500">
                  {remaining > 0
                    ? `Faltam ${remaining} aula${remaining === 1 ? '' : 's'} para completar a seleção.`
                    : 'Seleção completa. Podes avançar para o pagamento.'}
                </p>
              </div>

              {/* Selected lessons list */}
              {selectedLessons.length > 0 && (
                <div className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-[0_24px_60px_rgba(0,0,0,0.06)]">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-[#5a7ca8] mb-3">
                    Aulas selecionadas
                  </p>
                  <ul className="space-y-2">
                    {selectedLessons.map((l) => (
                      <li key={l.date} className="flex items-start gap-2.5">
                        <span className="w-6 h-6 rounded-md bg-[#111111] flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-white text-[9px] font-black">{l.id}</span>
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#000000] truncate">{l.topic}</p>
                          <p className="text-[10px] text-gray-400">
                            {l.date.split('-').reverse().join('/')} · {l.time}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Package summary */}
              <div className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-[0_24px_60px_rgba(0,0,0,0.06)]">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#5a7ca8] mb-3">Resumo</p>
                <p className="font-black text-[#000000] text-lg">{pkg.title}</p>
                <p className="text-3xl font-black text-[#000000] mt-1">{pkg.priceLabel}</p>
                <ul className="mt-4 space-y-1.5">
                  {pkg.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-gray-600">
                      <svg className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-[#000000]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              {!user && !authLoading && (
                <p className="text-xs text-gray-400 text-center">
                  Serás redirecionado para{' '}
                  <Link href={`/login?next=${encodeURIComponent(`/preparacao/selecionar?pacote=${packageId}`)}`} className="underline text-[#000000] font-semibold">
                    iniciar sessão
                  </Link>{' '}
                  antes do pagamento.
                </p>
              )}

              <button
                onClick={handleCheckout}
                disabled={selected.size !== maxSelections || checkoutLoading}
                className="w-full py-4 bg-[#000000] text-white font-bold rounded-2xl text-sm hover:shadow-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {checkoutLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    A processar...
                  </span>
                ) : selected.size !== maxSelections
                  ? `Seleciona ${remaining} aula${remaining === 1 ? '' : 's'} para continuar`
                  : `Pagar ${pkg.priceLabel}`}
              </button>

              <p className="text-center text-xs text-gray-400">
                Pagamento seguro via Stripe
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

// ─── Page (wrapped in Suspense for useSearchParams) ───────────────────────────

export default function SelecionarPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-[#000000] border-t-transparent rounded-full" />
      </div>
    }>
      <SelecionarContent />
    </Suspense>
  );
}
