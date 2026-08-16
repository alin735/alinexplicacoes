import Link from 'next/link';

/** Abas do topo do portal: o roadmap de aulas e a secção Importante. */
export default function PortalTabs({ active }: { active: 'aulas' | 'importante' }) {
  const base =
    'rounded-lg px-4 py-2 text-sm font-semibold transition';
  const on = 'bg-white shadow-sm text-black';
  const off = 'text-black/50 hover:text-black/70';

  return (
    <div className="mb-6 inline-flex gap-1 rounded-xl bg-black/5 p-1">
      <Link href="/roadmap" className={`${base} ${active === 'aulas' ? on : off}`}>
        Aulas
      </Link>
      <Link href="/importante" className={`${base} ${active === 'importante' ? on : off}`}>
        ⭐ Importante
      </Link>
    </div>
  );
}
