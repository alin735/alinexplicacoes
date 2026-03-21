'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import type { Profile } from '@/lib/types';

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async (userId: string) => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      setProfile(data);
    };

    const loadUserState = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const sessionUser = sessionData.session?.user ?? null;
      setUser(sessionUser);

      if (sessionUser) {
        await fetchProfile(sessionUser.id);
        return;
      }

      const { data: userData } = await supabase.auth.getUser();
      const fallbackUser = userData.user ?? null;
      setUser(fallbackUser);
      if (fallbackUser) {
        await fetchProfile(fallbackUser.id);
      } else {
        setProfile(null);
      }
    };

    loadUserState();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setDropdownOpen(false);
    router.push('/');
  };

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : profile?.username?.[0]?.toUpperCase() || '?';

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'py-2 bg-white/95 border-b border-black/15 shadow-sm'
          : 'py-3 bg-white/90 border-b border-black/10'
      } backdrop-blur-md`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
        {/* Brand */}
        <Link
          href="/"
          className="flex items-center gap-3 hover:scale-105 transition-transform"
        >
          <div className="w-10 h-10 rounded-full bg-white border-2 border-[#4a4a4a] overflow-hidden flex items-center justify-center">
            <Image src="/logo.png" alt="MatemáticaTop" width={40} height={40} className="object-cover" />
          </div>
          <span className="text-[#111111] font-bold text-xl tracking-wide hidden sm:block">
            MatemáticaTop
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-2">
          <Link
            href="/marcar"
            className="px-4 py-2 text-gray-700 hover:text-[#000000] hover:bg-black/5 rounded-full transition-all text-sm font-medium"
          >
            Marcar explicação
          </Link>
          <Link
            href="/cronograma"
            className="px-4 py-2 text-gray-700 hover:text-[#000000] hover:bg-black/5 rounded-full transition-all text-sm font-medium"
          >
            Cronograma
          </Link>
          <Link
            href="/aulas"
            className="px-4 py-2 text-gray-700 hover:text-[#000000] hover:bg-black/5 rounded-full transition-all text-sm font-medium"
          >
            Minhas aulas
          </Link>
          {user && (
            <Link
              href="/notas"
              className="px-4 py-2 text-gray-700 hover:text-[#000000] hover:bg-black/5 rounded-full transition-all text-sm font-medium"
            >
              Notas
            </Link>
          )}

          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                onMouseEnter={() => setDropdownOpen(true)}
                className="ml-2 flex items-center gap-2 group"
              >
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Avatar"
                    className="w-9 h-9 rounded-full border-2 border-[#4a4a4a] object-cover transition-transform group-hover:scale-110"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#000000] to-[#111111] border-2 border-[#4a4a4a] flex items-center justify-center text-white text-sm font-semibold transition-transform group-hover:scale-110">
                    {initials}
                  </div>
                )}
              </button>

              {dropdownOpen && (
                <div
                  onMouseLeave={() => setDropdownOpen(false)}
                  className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-fade-in-up"
                >
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="font-semibold text-[#000000] text-sm truncate">
                      {profile?.full_name || profile?.username || 'Utilizador'}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{user.email}</p>
                  </div>
                  <div className="py-1">
                    <Link
                      href="/conta"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-[#f5f5f5] transition-colors"
                    >
                      <svg className="w-4 h-4 text-[#000000]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Minha conta
                    </Link>
                    <Link
                      href="/contacto"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-[#f5f5f5] transition-colors"
                    >
                      <svg className="w-4 h-4 text-[#000000]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Contacto
                    </Link>
                    {profile?.is_admin && (
                      <Link
                        href="/admin"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-[#f5f5f5] transition-colors"
                      >
                        <svg className="w-4 h-4 text-[#000000]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Administração
                      </Link>
                    )}
                  </div>
                  <div className="border-t border-gray-100">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors w-full"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Terminar sessão
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="ml-2 px-5 py-2 bg-white hover:bg-black/5 text-[#111111] rounded-full text-sm font-medium border border-black/30 transition-all hover:border-black/60"
            >
              Login
            </Link>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden text-[#111111] p-2"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-black/10 animate-fade-in-up">
          <div className="px-4 py-3 space-y-1">
            <Link
              href="/marcar"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-2.5 text-gray-700 hover:bg-black/5 rounded-xl transition-colors text-sm"
            >
              Marcar explicação
            </Link>
            <Link
              href="/cronograma"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-2.5 text-gray-700 hover:bg-black/5 rounded-xl transition-colors text-sm"
            >
              Cronograma
            </Link>
            <Link
              href="/aulas"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-2.5 text-gray-700 hover:bg-black/5 rounded-xl transition-colors text-sm"
            >
              Minhas aulas
            </Link>
            {user && (
              <Link
                href="/notas"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2.5 text-gray-700 hover:bg-black/5 rounded-xl transition-colors text-sm"
              >
                Notas
              </Link>
            )}
            {user ? (
              <>
                <Link
                  href="/conta"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-2.5 text-gray-700 hover:bg-black/5 rounded-xl transition-colors text-sm"
                >
                  Minha conta
                </Link>
                <Link
                  href="/contacto"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-2.5 text-gray-700 hover:bg-black/5 rounded-xl transition-colors text-sm"
                >
                  Contacto
                </Link>
                {profile?.is_admin && (
                  <Link
                    href="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-2.5 text-gray-700 hover:bg-black/5 rounded-xl transition-colors text-sm"
                  >
                    Administração
                  </Link>
                )}
                <button
                  onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                  className="block w-full text-left px-4 py-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-colors text-sm"
                >
                  Terminar sessão
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2.5 text-[#111111] hover:bg-black/5 rounded-xl transition-colors text-sm font-medium"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
