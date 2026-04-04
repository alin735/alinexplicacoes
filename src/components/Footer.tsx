'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import BrandIcon from '@/components/BrandIcon';
import { createClient } from '@/lib/supabase';
import type { Profile } from '@/lib/types';

export default function Footer() {
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const loadState = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const activeUser = sessionData.session?.user ?? null;
      setUser(activeUser);

      if (!activeUser) {
        setProfile(null);
        return;
      }

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', activeUser.id)
        .single();

      setProfile(data as Profile | null);
    };

    void loadState();
  }, [supabase]);

  const handleSubscribe = async () => {
    setSubmitting(true);
    setMessage('');
    setError('');

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      const payload: Record<string, string> = {};

      if (user) {
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData.session?.access_token;
        if (!accessToken) {
          throw new Error('Sessão inválida. Volta a iniciar sessão.');
        }
        headers.Authorization = `Bearer ${accessToken}`;
      } else {
        if (!email.trim()) {
          throw new Error('Indica o teu email.');
        }
        payload.email = email.trim();
      }

      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const responsePayload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(responsePayload.error || 'Não foi possível aderir à newsletter.');
      }

      if (user) {
        setProfile((current) => (current ? { ...current, newsletter_opt_in: true } : current));
      } else {
        setEmail('');
      }

      setMessage('Subscrição registada com sucesso.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível aderir à newsletter.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <footer className="bg-white border-t-[3px] border-[#000000] py-8">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <div className="mx-auto mb-8 max-w-3xl rounded-[2rem] border border-black/10 bg-[#f7f9fc] px-5 py-6 shadow-[0_14px_34px_rgba(0,0,0,0.05)]">
          <h2 className="text-xl sm:text-2xl font-bold text-[#111111]">Newsletter</h2>
          <p className="mt-2 text-sm text-gray-600">
            Recebe novidades e recursos da MatemáticaTop no teu email.
          </p>

          {!user ? (
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="O teu email"
                className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-[#111111] outline-none transition-all focus:border-[#3f6c93] focus:ring-2 focus:ring-[#3f6c93]/20 sm:max-w-xs"
              />
              <button
                type="button"
                onClick={() => void handleSubscribe()}
                disabled={submitting}
                className="rounded-2xl bg-[#111111] px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-[#1d2b38] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? 'A aderir...' : 'Aderir à newsletter'}
              </button>
            </div>
          ) : (
            <div className="mt-5">
              <button
                type="button"
                onClick={() => void handleSubscribe()}
                disabled={submitting || Boolean(profile?.newsletter_opt_in)}
                className="rounded-2xl bg-[#111111] px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-[#1d2b38] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {profile?.newsletter_opt_in ? 'Já aderiste à newsletter' : submitting ? 'A aderir...' : 'Aderir à newsletter'}
              </button>
              <p className="mt-2 text-xs text-gray-500">
                O email usado para a newsletter será o email da tua conta.
              </p>
            </div>
          )}

          {message && <p className="mt-3 text-sm text-emerald-700">{message}</p>}
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </div>

        <div className="flex items-center justify-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-full bg-white border border-black/25 overflow-hidden flex items-center justify-center">
            <Image src="/logo.png" alt="MatemáticaTop" width={36} height={36} className="object-cover" />
          </div>
          <span className="text-[#111111] font-bold text-xl">MatemáticaTop</span>
        </div>
        <div className="flex justify-center gap-5 mb-5">
          <a
            href="https://www.tiktok.com/@matematicatop1?is_from_webapp=1&sender_device=pc"
            target="_blank"
            rel="noopener noreferrer"
            className="w-12 h-12 rounded-full bg-white border border-black/30 flex items-center justify-center hover:bg-black/5 hover:-translate-y-1 hover:shadow-lg transition-all"
          >
            <BrandIcon token="tiktok" size={22} />
          </a>
          <a
            href="https://youtube.com/@matematicatop1?si=dH9qdhF7ur3Y9EhR"
            target="_blank"
            rel="noopener noreferrer"
            className="w-12 h-12 rounded-full bg-white border border-black/30 flex items-center justify-center hover:bg-black/5 hover:-translate-y-1 hover:shadow-lg transition-all"
          >
            <BrandIcon token="youtube" size={22} />
          </a>
          <a
            href="https://discord.gg/7eK2QAsp23"
            target="_blank"
            rel="noopener noreferrer"
            className="w-12 h-12 rounded-full bg-white border border-black/30 flex items-center justify-center hover:bg-black/5 hover:-translate-y-1 hover:shadow-lg transition-all"
          >
            <BrandIcon token="discord" size={22} />
          </a>
        </div>

        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 mb-5 text-sm font-medium text-gray-600">
          <Link href="/contacto" className="hover:text-[#000000] transition-colors">
            Contacto
          </Link>
          <Link href="/termos-de-utilizador" className="hover:text-[#000000] transition-colors">
            Termos e condições
          </Link>
        </nav>

        <p className="text-gray-500 text-sm">
          © {new Date().getFullYear()} MatemáticaTop. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
