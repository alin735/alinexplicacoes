import Link from 'next/link';
import { SECTION_LIST } from '@/lib/portal';

/** Abas do topo do portal: o roadmap de aulas e as secções de materiais. */
export default function PortalTabs({ active }: { active: 'aulas' | 'importante' | 'fichas' | 'testes' }) {
  const base = 'whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-semibold transition';
  const on = 'bg-white shadow-sm text-black';
  const off = 'text-black/50 hover:text-black/70';

  return (
    <div className="mb-6 -mx-1 overflow-x-auto px-1 pb-1">
      <div className="inline-flex gap-1 rounded-xl bg-black/5 p-1">
        <Link href="/roadmap" className={`${base} ${active === 'aulas' ? on : off}`}>
          Aulas
        </Link>
        {SECTION_LIST.map((s) => (
          <Link key={s.slug} href={`/${s.slug}`} className={`${base} ${active === s.slug ? on : off}`}>
            {s.aba}
          </Link>
        ))}
      </div>
    </div>
  );
}
