import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { getStudentSessionId, getAdminSession } from '@/lib/portal-session';
import PortalLogout from './PortalLogout';

export const metadata: Metadata = {
  title: 'Portal do Aluno',
  description: 'Área reservada aos alunos das explicações de Matemática A.',
  robots: { index: false, follow: false },
};

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const isAdmin = getAdminSession();
  const isStudent = !isAdmin && Boolean(getStudentSessionId());
  return (
    <div className="min-h-screen flex flex-col bg-[#f5f5f5] text-[#1a1a2e]">
      <header className="sticky top-0 z-40 border-b border-black/10 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5">
          <Link href="/" className="flex items-center gap-2.5 font-extrabold tracking-tight">
            <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border-2 border-[#4a4a4a] bg-white">
              <Image src="/logo.png" alt="MatemáticaTop" width={36} height={36} className="object-cover" />
            </span>
            <span className="text-lg">MatemáticaTop</span>
            <span className="ml-1 rounded-full bg-black/5 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-black/60">
              Portal
            </span>
          </Link>
          {(isStudent || isAdmin) && <PortalLogout kind={isAdmin ? 'admin' : 'student'} />}
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-8">{children}</main>

      <footer className="border-t border-black/10 py-6 text-center text-xs text-black/40">
        © {new Date().getFullYear()} MatemáticaTop · Portal do Aluno
      </footer>
    </div>
  );
}
