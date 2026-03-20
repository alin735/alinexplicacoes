'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { createClient } from '@/lib/supabase';
import type { Profile } from '@/lib/types';
import MathRain from '@/components/MathRain';
import { getInviteCodeFromUserId } from '@/lib/booking-utils';

export default function ContaPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState('');
  const [passwordErrorMsg, setPasswordErrorMsg] = useState('');
  const [copySuccess, setCopySuccess] = useState('');
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const init = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      let activeUser = sessionData.session?.user ?? null;

      if (!activeUser) {
        const { data: userData } = await supabase.auth.getUser();
        activeUser = userData.user ?? null;
      }

      if (!activeUser) { router.push('/login'); return; }
      setUser(activeUser);

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', activeUser.id)
        .single();

      if (data) {
        setProfile(data);
        setUsername(data.username || '');
        setFullName(data.full_name || '');
      }
      setLoading(false);
    };
    init();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ username, full_name: fullName })
        .eq('id', user.id);

      if (error) throw error;
      setSuccessMsg('Perfil atualizado com sucesso!');
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao atualizar perfil.');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSaving(true);
    setPasswordSuccessMsg('');
    setPasswordErrorMsg('');

    try {
      if (newPassword.length < 6) {
        throw new Error('A nova password deve ter pelo menos 6 caracteres.');
      }
      if (newPassword !== confirmPassword) {
        throw new Error('As passwords não coincidem.');
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setNewPassword('');
      setConfirmPassword('');
      setPasswordSuccessMsg('Password atualizada com sucesso!');
    } catch (err: any) {
      setPasswordErrorMsg(err.message || 'Erro ao atualizar password.');
    } finally {
      setPasswordSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0f4f8]">
        <div className="animate-spin w-8 h-8 border-4 border-[#3498db] border-t-transparent rounded-full" />
      </div>
    );
  }

  const initials = fullName
    ? fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : username?.[0]?.toUpperCase() || '?';
  const inviteCode = user?.id ? getInviteCodeFromUserId(user.id) : '';

  return (
    <>
      <Navbar />
      <main className="pt-20 min-h-screen bg-[#f0f4f8]">
        <div className="relative bg-gradient-to-r from-[#0d2f4a] to-[#1a5276] py-12 px-4 overflow-hidden">
          <MathRain />
          <div className="relative z-10 max-w-2xl mx-auto text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#3498db] to-[#1a5276] border-4 border-[#5dade2] flex items-center justify-center text-white text-2xl font-bold">
              {initials}
            </div>
            <h1 className="text-3xl font-bold text-white mb-1">Minha conta</h1>
            <p className="text-white/60 text-sm">{user?.email}</p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
          <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-md p-8 space-y-6 animate-fade-in-up">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Nome de utilizador
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3498db] focus:border-transparent outline-none bg-[#f0f4f8] text-sm"
                placeholder="O teu username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Nome completo
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3498db] focus:border-transparent outline-none bg-[#f0f4f8] text-sm"
                placeholder="O teu nome completo"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-100 text-sm text-gray-500 cursor-not-allowed"
              />
              <p className="text-xs text-gray-400 mt-1">O email não pode ser alterado.</p>
            </div>

            <div className="rounded-xl border border-[#3498db]/20 bg-[#f8fbff] p-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Código de utilizador (aulas de grupo)
              </label>
              <div className="flex items-center justify-between gap-3">
                <code className="text-sm font-bold text-[#0d2f4a]">{inviteCode}</code>
                <button
                  type="button"
                  onClick={async () => {
                    if (!inviteCode) return;
                    try {
                      await navigator.clipboard.writeText(inviteCode);
                      setCopySuccess('Código copiado!');
                      setTimeout(() => setCopySuccess(''), 2000);
                    } catch {
                      setCopySuccess('Não foi possível copiar.');
                      setTimeout(() => setCopySuccess(''), 2000);
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg border border-[#3498db]/30 text-[#1a5276] text-xs font-semibold hover:bg-[#3498db]/10 transition-colors"
                >
                  Copiar
                </button>
              </div>
              {copySuccess && (
                <p className="text-xs text-[#3498db] mt-2">{copySuccess}</p>
              )}
            </div>

            {successMsg && (
              <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-xl text-sm">
                ✅ {successMsg}
              </div>
            )}
            {errorMsg && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
                ❌ {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3.5 bg-gradient-to-r from-[#1a5276] to-[#2980b9] text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-[#3498db]/30 transition-all disabled:opacity-50 text-sm"
            >
              {saving ? 'A guardar...' : 'Guardar alterações'}
            </button>
          </form>

          <form onSubmit={handlePasswordUpdate} className="bg-white rounded-2xl shadow-md p-8 space-y-5 animate-fade-in-up">
            <div>
              <h2 className="text-xl font-bold text-[#0d2f4a] mb-1">Segurança</h2>
              <p className="text-sm text-gray-500">Altera a tua password quando precisares.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Nova password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3498db] focus:border-transparent outline-none bg-[#f0f4f8] text-sm"
                placeholder="••••••••"
                minLength={6}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Confirmar nova password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3498db] focus:border-transparent outline-none bg-[#f0f4f8] text-sm"
                placeholder="••••••••"
                minLength={6}
                required
              />
            </div>

            {passwordSuccessMsg && (
              <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-xl text-sm">
                ✅ {passwordSuccessMsg}
              </div>
            )}
            {passwordErrorMsg && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
                ❌ {passwordErrorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={passwordSaving}
              className="w-full py-3.5 bg-gradient-to-r from-[#0d2f4a] to-[#1a5276] text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-[#1a5276]/30 transition-all disabled:opacity-50 text-sm"
            >
              {passwordSaving ? 'A atualizar...' : 'Atualizar password'}
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </>
  );
}
