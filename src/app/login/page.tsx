'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import MathRain from '@/components/MathRain';
import { SUBJECTS } from '@/lib/types';

type AuthMode = 'login' | 'register';

export default function LoginPage() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [mathGrade, setMathGrade] = useState('');

  const [showResetPanel, setShowResetPanel] = useState(false);
  const [resetUsername, setResetUsername] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState('');
  const [resetError, setResetError] = useState('');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClient();

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
      if (mode === 'register') {
        const normalizedUsername = username.trim().toLowerCase();
        if (!normalizedUsername) {
          throw new Error('Indica um nome de utilizador.');
        }

        const normalizedMathGrade = mathGrade.trim().replace(',', '.');
        if (!normalizedMathGrade) {
          throw new Error('Indica a tua classificação de Matemática.');
        }
        const parsedMathGrade = Number(normalizedMathGrade);
        if (Number.isNaN(parsedMathGrade) || parsedMathGrade < 0 || parsedMathGrade > 20) {
          throw new Error('A classificação de Matemática deve estar entre 0 e 20.');
        }

        const initialSubjects = [
          {
            subject: SUBJECTS[0],
            grade: normalizedMathGrade,
          },
        ];

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              username: normalizedUsername,
              initial_subjects: initialSubjects,
            },
          },
        });
        if (error) throw error;

        if (typeof window !== 'undefined' && data.user?.id) {
          window.localStorage.setItem(
            `matematicatop-signup-initial:${data.user.id}`,
            JSON.stringify({
              subject: SUBJECTS[0],
              grade: parsedMathGrade,
            }),
          );
        }

        setMessage('Verifica o teu email para confirmar a conta!');
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        const session = data.session || (await waitForSession());
        if (!session?.user) {
          throw new Error('Login efetuado, mas a sessão não foi iniciada. Tenta novamente.');
        }
        router.replace('/');
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro. Tenta novamente.');
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
      setResetError(err.message || 'Não foi possível iniciar a recuperação da password.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0d2f4a] via-[#1a5276] to-[#2980b9] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Math rain */}
      <MathRain />

      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#5dade2]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#3498db]/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-8 transition-colors text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Voltar ao início
        </Link>

        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#1a5276] to-[#2980b9] px-8 py-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white">
              {mode === 'login' ? 'Entrar' : 'Criar conta'}
            </h1>
            <p className="text-white/70 text-sm mt-1">
              {mode === 'login'
                ? 'Acede à tua conta de explicações'
                : 'Regista-te para marcar explicações'}
            </p>
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
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3498db] focus:border-transparent outline-none transition-all text-sm"
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
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3498db] focus:border-transparent outline-none transition-all text-sm"
                      placeholder="ex: joao11"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Classificação de Matemática
                    </label>
                    <input
                      type="number"
                      value={mathGrade}
                      onChange={(e) => setMathGrade(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3498db] focus:border-transparent outline-none transition-all text-sm"
                      placeholder="0-20"
                      min={0}
                      max={20}
                      step={0.1}
                      required
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Esta classificação inicial vai aparecer automaticamente na secção Notas.
                    </p>
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
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3498db] focus:border-transparent outline-none transition-all text-sm"
                  placeholder="o.teu@email.com"
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
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3498db] focus:border-transparent outline-none transition-all text-sm"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>

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
                className="w-full py-3.5 bg-gradient-to-r from-[#1a5276] to-[#2980b9] text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-[#3498db]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    A processar...
                  </span>
                ) : mode === 'login' ? 'Entrar' : 'Criar conta'}
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
                  className="block w-full text-sm text-[#3498db] hover:text-[#1a5276] transition-colors mb-3"
                >
                  Esqueceste-te da password?
                </button>
              )}

              {mode === 'login' && showResetPanel && (
                <div className="text-left bg-[#f0f4f8] border border-gray-200 rounded-xl p-4 mb-4 space-y-3">
                  <p className="text-sm font-medium text-[#0d2f4a]">
                    Recuperar password
                  </p>
                  <input
                    type="text"
                    value={resetUsername}
                    onChange={(e) => setResetUsername(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3498db] focus:border-transparent outline-none transition-all text-sm bg-white"
                    placeholder="Nome de utilizador"
                  />
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3498db] focus:border-transparent outline-none transition-all text-sm bg-white"
                    placeholder="Email da conta"
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
                    className="w-full py-2.5 bg-gradient-to-r from-[#1a5276] to-[#2980b9] text-white font-semibold rounded-lg hover:shadow-md transition-all disabled:opacity-50 text-sm"
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
                }}
                className={`block w-full text-sm text-gray-500 hover:text-[#3498db] transition-colors ${mode === 'login' ? 'mt-3' : ''}`}
              >
                {mode === 'login'
                  ? 'Não tens conta? Cria uma aqui'
                  : 'Já tens conta? Entra aqui'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
