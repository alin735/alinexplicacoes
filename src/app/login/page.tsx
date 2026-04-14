'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import MathRain from '@/components/MathRain';

type AuthMode = 'login' | 'register';

function toPortugueseAuthError(message?: string): string {
  if (!message) return 'Ocorreu um erro. Tenta novamente.';

  const normalized = message.toLowerCase();
  if (normalized.includes('email rate limit exceeded')) {
    return 'Excedeste o limite de tentativas de email. Aguarda alguns minutos e tenta novamente.';
  }
  if (normalized.includes('invalid login credentials')) {
    return 'Email ou password incorretos.';
  }
  if (normalized.includes('user already registered')) {
    return 'Este email já está registado.';
  }
  if (normalized.includes('password should be at least')) {
    return 'A password deve ter pelo menos 6 caracteres.';
  }
  if (normalized.includes('unable to validate email address')) {
    return 'Indica um endereço de email válido.';
  }

  return message;
}

export default function LoginPage() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [wantsNewsByEmail, setWantsNewsByEmail] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [showResetPanel, setShowResetPanel] = useState(false);
  const [resetUsername, setResetUsername] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState('');
  const [resetError, setResetError] = useState('');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const resetEmailRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const getSafeNextPath = (candidate: string | null): string => {
    if (!candidate) return '/';
    if (!candidate.startsWith('/') || candidate.startsWith('//')) return '/';
    return candidate;
  };

  const waitForSession = async () => {
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      if (data.session?.user) return data.session;
      await new Promise((resolve) => setTimeout(resolve, 150));
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const normalizedPassword = password;

      if (!normalizedEmail) {
        throw new Error('Indica o email.');
      }
      if (!normalizedPassword) {
        throw new Error('Indica a password.');
      }

      if (mode === 'register') {
        const normalizedFullName = fullName.trim();
        const normalizedUsername = username.trim().toLowerCase();
        if (!normalizedFullName) {
          throw new Error('Indica o nome completo.');
        }
        if (!normalizedUsername) {
          throw new Error('Indica um nome de utilizador.');
        }

        if (!acceptedTerms) {
          throw new Error('Tens de aceitar os termos de utilizador para criares conta.');
        }

        const { data, error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password: normalizedPassword,
          options: {
            data: {
              full_name: normalizedFullName,
              username: normalizedUsername,
              newsletter_opt_in: wantsNewsByEmail,
              terms_accepted: true,
              terms_accepted_at: new Date().toISOString(),
              terms_version: 'v1',
            },
          },
        });
        if (error) throw error;

        const isAlreadyConfirmed = Boolean(
          data?.session ||
          data?.user?.email_confirmed_at ||
          data?.user?.confirmed_at ||
          data?.user?.user_metadata?.email_verified === true,
        );
        const isExistingUserObfuscatedResponse = Boolean(
          !data?.session &&
          data?.user &&
          Array.isArray(data.user.identities) &&
          data.user.identities.length === 0,
        );

        if (isAlreadyConfirmed) {
          setMessage('Conta criada com sucesso! Já podes fazer login.');
          setMode('login');
          setPassword('');
        } else if (isExistingUserObfuscatedResponse) {
          setMessage('Se este email já estiver registado, faz login. Caso contrário, verifica o teu email.');
          setMode('login');
          setPassword('');
        } else {
          setMessage('Verifica o teu email para confirmar a conta!');
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password: normalizedPassword,
        });
        if (error) throw error;
        const session = data.session || (await waitForSession());
        if (!session?.user) {
          throw new Error('Login efetuado, mas a sessão não foi iniciada. Tenta novamente.');
        }
        const nextParam =
          typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('next') : null;
        const nextPath = getSafeNextPath(nextParam);
        router.replace(nextPath);
        router.refresh();
      }
    } catch (err: any) {
      setError(toPortugueseAuthError(err?.message));
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    setResetLoading(true);
    setResetError('');
    setResetMessage('');

    try {
      const userNameValue = resetUsername.trim();
      const emailValue = resetEmail.trim().toLowerCase();

      if (resetEmailRef.current && !resetEmailRef.current.checkValidity()) {
        resetEmailRef.current.reportValidity();
        return;
      }

      if (!userNameValue || !emailValue) {
        throw new Error('Preenche o nome de utilizador e o email.');
      }

      const { data: isValidUser, error: validationError } = await supabase.rpc(
        'check_username_email',
        {
          _username: userNameValue,
          _email: emailValue,
        },
      );

      if (validationError) throw validationError;
      if (!isValidUser) {
        throw new Error('Não encontrámos uma conta com esse nome de utilizador e email.');
      }

      const { error } = await supabase.auth.resetPasswordForEmail(emailValue, {
        redirectTo: `${window.location.origin}/conta`,
      });

      if (error) throw error;
      setResetMessage('Link de recuperação enviado! Verifica o teu email.');
    } catch (err: any) {
      setResetError(toPortugueseAuthError(err?.message));
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center px-4 py-12 relative overflow-hidden border-t border-black/10">
      {/* Math rain */}
      <MathRain />

      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#4a4a4a]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-black/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-[#000000] mb-8 transition-colors text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Voltar ao início
        </Link>

        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-white border-b border-black/10 px-8 py-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-black/5 border border-black/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-[#111111]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-[#000000] mb-2">
              {mode === 'login' ? 'Login' : 'Criar conta'}
            </h1>
          </div>

          <div className="px-8 py-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Nome completo
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#000000] focus:border-transparent outline-none transition-all text-sm"
                      placeholder="O teu nome"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Nome de utilizador
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#000000] focus:border-transparent outline-none transition-all text-sm"
                      placeholder="ex: joao11"
                      required
                    />
                  </div>

                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError('');
                  }}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#000000] focus:border-transparent outline-none transition-all text-sm"
                  placeholder="o.teu@email.com"
                  pattern="^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#000000] focus:border-transparent outline-none transition-all text-sm"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>

              {mode === 'register' && (
                <div className="rounded-xl border border-gray-200 bg-[#fafafa] px-4 py-3 space-y-3">
                  <label className="flex items-start gap-3 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={wantsNewsByEmail}
                      onChange={(e) => setWantsNewsByEmail(e.target.checked)}
                      className="mt-0.5 w-4 h-4 text-[#111111] border-gray-300 rounded focus:ring-[#000000]"
                    />
                    <span>Quero receber novidades e atualizações por email.</span>
                  </label>

                  <label className="flex items-start gap-3 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      className="mt-0.5 w-4 h-4 text-[#111111] border-gray-300 rounded focus:ring-[#000000]"
                      required={mode === 'register'}
                    />
                    <span>
                      Li e aceito os{' '}
                      <Link
                        href="/termos-de-utilizador"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#111111] font-semibold underline hover:text-[#2a2a2a]"
                      >
                        termos de utilizador
                      </Link>
                      .
                    </span>
                  </label>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}

              {message && (
                <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-xl text-sm">
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-[#111111] to-[#2a2a2a] text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    A processar...
                  </span>
                ) : mode === 'login' ? 'Login' : 'Criar conta'}
              </button>
            </form>

            <div className="mt-6 text-center">
              {mode === 'login' && (
                <button
                  onClick={() => {
                    setShowResetPanel((prev) => !prev);
                    setResetError('');
                    setResetMessage('');
                  }}
                  className="block w-full text-sm text-gray-500 hover:text-[#000000] transition-colors mb-3"
                >
                  Esqueceste-te da password?
                </button>
              )}

              {mode === 'login' && showResetPanel && (
                <div className="text-left bg-[#f5f5f5] border border-gray-200 rounded-xl p-4 mb-4 space-y-3">
                  <p className="text-sm font-medium text-[#000000]">
                    Recuperar password
                  </p>
                  <input
                    type="text"
                    value={resetUsername}
                    onChange={(e) => setResetUsername(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#000000] focus:border-transparent outline-none transition-all text-sm bg-white"
                    placeholder="Nome de utilizador"
                  />
                  <input
                    type="email"
                    ref={resetEmailRef}
                    value={resetEmail}
                    onChange={(e) => {
                      setResetEmail(e.target.value);
                      if (resetError) setResetError('');
                    }}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#000000] focus:border-transparent outline-none transition-all text-sm bg-white"
                    placeholder="Email da conta"
                    pattern="^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$"
                    required
                  />
                  {resetError && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg text-xs">
                      {resetError}
                    </div>
                  )}
                  {resetMessage && (
                    <div className="bg-green-50 border border-green-200 text-green-600 px-3 py-2 rounded-lg text-xs">
                      {resetMessage}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={handlePasswordReset}
                    disabled={resetLoading}
                    className="w-full py-2.5 bg-gradient-to-r from-[#111111] to-[#2a2a2a] text-white font-semibold rounded-lg hover:shadow-md transition-all disabled:opacity-50 text-sm"
                  >
                    {resetLoading ? 'A enviar...' : 'Enviar link de recuperação'}
                  </button>
                </div>
              )}

              <button
                onClick={() => {
                  setMode(mode === 'login' ? 'register' : 'login');
                  setError('');
                  setMessage('');
                  setShowResetPanel(false);
                  setResetError('');
                  setResetMessage('');
                  setAcceptedTerms(false);
                }}
                className={`block w-full text-sm text-gray-500 hover:text-[#000000] transition-colors ${mode === 'login' ? 'mt-3' : ''}`}
              >
                {mode === 'login'
                  ? 'Não tens conta? Cria uma aqui'
                  : 'Já tens conta? Login'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
