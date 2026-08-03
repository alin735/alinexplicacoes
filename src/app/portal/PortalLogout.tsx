'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function PortalLogout({ kind }: { kind: 'student' | 'admin' }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    try {
      if (kind === 'admin') {
        await fetch('/api/portal/admin/login', { method: 'DELETE' });
      } else {
        await fetch('/api/portal/logout', { method: 'POST' });
      }
      router.push('/');
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={logout}
      disabled={loading}
      className="rounded-full border border-black/15 px-3 py-1.5 text-xs font-semibold text-black/60 transition hover:bg-black/5 disabled:opacity-50"
    >
      {loading ? 'A sair…' : 'Sair'}
    </button>
  );
}
