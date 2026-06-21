'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MathRain from '@/components/MathRain';
import PreparacaoCalendar from '@/components/PreparacaoCalendar';
import { createClient } from '@/lib/supabase';
import {
  GROUP_CLASS_PACKAGES,
  GROUP_CLASS_SCHOOL_YEAR,
  type GroupClassPackageId,
} from '@/lib/group-classes';

// ─── Constants ────────────────────────────────────────────────────────────────

const EXAM_DATE = new Date('2026-06-22T09:30:00');

const FAQS = [
  {
    q: 'Preciso ter boas notas para entrar?',
    a: 'Não. Esta preparação é para qualquer aluno do 9.º ano que queira chegar ao exame mais confiante e organizado, independentemente de como estás agora.',
  },
  {
    q: 'O que acontece se faltar a uma aula?',
    a: 'Todas as aulas ficam gravadas. Podes ver a qualquer momento, ao teu ritmo, com acesso às gravações logo após cada sessão.',
  },
  {
    q: 'Como se realizam as aulas?',
    a: 'As aulas decorrem ao vivo na Skool da MatemáticaTop, com partilha de ecrã e explicação passo a passo. Ao inscreveres-te receberás as indicações para acederes à comunidade.',
  },
  {
    q: 'O que é a Skool da MatemáticaTop?',
    a: 'É a plataforma da MatemáticaTop onde ficam as gravações de todas as aulas organizadas por tema, os materiais de cada sessão e fichas de prática com exercícios tipo exame. A partir do próximo ano letivo, serão adicionados conteúdos para o 10.º, 11.º e 12.º ano. Em setembro de 2026, a Skool passa a custar 29€/mês para novos membros. Quem entra agora no Pacote Completo fica com acesso vitalício, sem pagar nada a mais.',
  },
  {
    q: 'O Pacote Intermédio: posso escolher qualquer 7 aulas?',
    a: 'Sim. Escolhes as 7 aulas que fazem mais sentido para ti e podes focar-te nos temas onde tens mais dificuldade.',
  },
  {
    q: 'A garantia aplica-se a todos os pacotes?',
    a: 'A garantia aplica-se ao Pacote Completo. Se no final sentires que não valeu a pena, o Alin devolve-te o dinheiro sem questões.',
  },
];

// ─── Countdown ────────────────────────────────────────────────────────────────

function Countdown() {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const tick = () => {
      const diff = EXAM_DATE.getTime() - Date.now();
      if (diff <= 0) { setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 }); return; }
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="inline-flex items-center gap-2 sm:gap-3">
      {([
        { label: 'dias', value: timeLeft.days },
        { label: 'horas', value: timeLeft.hours },
        { label: 'min', value: timeLeft.minutes },
        { label: 'seg', value: timeLeft.seconds },
      ] as const).map(({ label, value }, i, arr) => (
        <div key={label} className="flex items-center gap-2 sm:gap-3">
          <div className="flex flex-col items-center">
            <span className="text-3xl sm:text-4xl font-black text-[#000000] tabular-nums leading-none">
              {String(value).padStart(2, '0')}
            </span>
            <span className="text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider mt-1">{label}</span>
          </div>
          {i < arr.length - 1 && (
            <span className="text-2xl sm:text-3xl font-black text-gray-300 leading-none pb-4">:</span>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Package Card ──────────────────────────────────────────────────────────────

function PackageCard({
  pkg,
  onCheckout,
  loading,
  disabledReason,
}: {
  pkg: (typeof GROUP_CLASS_PACKAGES)[GroupClassPackageId];
  onCheckout: (id: GroupClassPackageId) => void;
  loading: boolean;
  disabledReason?: string;
}) {
  const isHighlighted = pkg.highlighted;
  const isDisabled = Boolean(disabledReason);
  return (
    <div
      className={`relative flex flex-col rounded-[2rem] border transition-all ${
        isHighlighted
          ? 'border-[#000000] bg-[#000000] text-white shadow-[0_32px_72px_rgba(0,0,0,0.22)]'
          : 'border-black/10 bg-white shadow-[0_24px_60px_rgba(0,0,0,0.08)]'
      }`}
    >
      {isHighlighted && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
          <span className="inline-flex items-center rounded-full bg-white text-[#000000] text-xs font-black uppercase tracking-[0.18em] px-4 py-1.5 shadow-lg border border-black/10">
            {pkg.badge}
          </span>
        </div>
      )}

      <div className="p-6 sm:p-8 flex flex-col flex-1">
        {!isHighlighted && (
          <span className={`self-start inline-flex rounded-full text-xs font-black uppercase tracking-[0.18em] px-3 py-1 mb-4 ${
            pkg.id === 'avulsa' ? 'bg-[#f5f5f5] text-gray-500' : 'bg-[#f0f4f8] text-[#5a7ca8]'
          }`}>
            {pkg.badge}
          </span>
        )}
        {isHighlighted && <div className="h-4" />}

        <h3 className={`text-2xl font-black mb-1 ${isHighlighted ? 'text-white' : 'text-[#000000]'}`}>
          {pkg.title}
        </h3>

        <div className="mt-3 mb-4">
          {pkg.originalPriceLabel && (
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl font-bold line-through text-white/30">{pkg.originalPriceLabel}</span>
              <span className="text-[10px] font-black uppercase tracking-wider text-white/40">só em aulas</span>
            </div>
          )}
          <div className="flex items-end gap-1">
            <span className={`text-5xl font-black leading-none ${isHighlighted ? 'text-white' : 'text-[#000000]'}`}>
              {pkg.priceLabel}
            </span>
            {pkg.id === 'avulsa' && (
              <span className={`text-sm mb-2 ${isHighlighted ? 'text-white/60' : 'text-gray-400'}`}>/ aula</span>
            )}
          </div>
          {pkg.originalPriceLabel && (
            <p className="text-[11px] text-white/50 mt-1.5 font-medium">
              Poupas 80€ em aulas + Skool vitalícia incluída
            </p>
          )}
        </div>

        {pkg.tagline && (
          <p className="text-xs leading-relaxed text-white/60 mb-4">{pkg.tagline}</p>
        )}

        <ul className="space-y-2.5 flex-1">
          {pkg.features.map((f) => (
            <li key={f} className="flex items-start gap-2.5 text-sm leading-relaxed">
              <svg className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isHighlighted ? 'text-white' : 'text-[#000000]'}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              <span className={isHighlighted ? 'text-white/90' : 'text-gray-700'}>{f}</span>
            </li>
          ))}
          {pkg.exclusions.map((e) => (
            <li key={e} className="flex items-start gap-2.5 text-sm leading-relaxed">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span className="text-gray-400">{e}</span>
            </li>
          ))}
        </ul>

        {pkg.id === 'completo' && (
          <p className={`mt-4 text-xs italic ${isHighlighted ? 'text-white/60' : 'text-gray-400'}`}>
            Inclui garantia de satisfação
          </p>
        )}

        <button
          onClick={() => onCheckout(pkg.id)}
          disabled={loading || isDisabled}
          className={`mt-6 w-full py-4 rounded-xl font-bold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
            isHighlighted
              ? 'bg-white text-[#000000] hover:bg-[#f5f5f5] hover:shadow-lg'
              : 'bg-[#000000] text-white hover:shadow-xl hover:shadow-[#000000]/20'
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              A processar...
            </span>
          ) : isDisabled ? 'Indisponível' : pkg.cta}
        </button>
        {disabledReason && (
          <p className={`mt-3 text-xs text-center ${isHighlighted ? 'text-white/70' : 'text-gray-500'}`}>
            {disabledReason}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <details className="group rounded-[1.75rem] border border-black/10 bg-white px-6 py-5 shadow-[0_16px_45px_rgba(0,0,0,0.05)]">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-black text-[#000000] sm:text-lg">
        {q}
        <span className="inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-black/10 text-xl leading-none transition-transform group-open:rotate-45">+</span>
      </summary>
      <p className="mt-4 text-sm leading-relaxed text-gray-600 sm:text-base">{a}</p>
    </details>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function PreparacaoPage() {
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<GroupClassPackageId | null>(null);
  const [checkoutError, setCheckoutError] = useState('');
  const [mounted, setMounted] = useState(false);
  const [purchasedLessonIds, setPurchasedLessonIds] = useState<Set<number>>(new Set());
  const [hasComplete, setHasComplete] = useState(false);
  const packagesRef = useRef<HTMLElement>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    setMounted(true);
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user ?? null);
      setAuthLoading(false);
    };
    void checkAuth();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e: any, s: any) => {
      setUser(s?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setPurchasedLessonIds(new Set());
      setHasComplete(false);
      return;
    }
    const fetchPurchased = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData.session?.access_token;
        if (!accessToken) return;
        const res = await fetch('/api/group-classes/my-lessons', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        setPurchasedLessonIds(new Set<number>(data.lessonIds || []));
        setHasComplete(Boolean(data.hasComplete));
      } catch {
        // ignorar
      }
    };
    void fetchPurchased();
  }, [user]);

  const totalLessons = 15;
  const availableCount = totalLessons - purchasedLessonIds.size;

  const getDisabledReason = (pkgId: GroupClassPackageId): string | undefined => {
    const pkg = GROUP_CLASS_PACKAGES[pkgId];
    if (pkg.disabled) return pkg.disabledLabel ?? 'Temporariamente indisponível.';
    if (!user) return undefined;
    if (hasComplete) return 'Já tens o Pacote Completo.';
    if (pkgId === 'completo' && purchasedLessonIds.size >= totalLessons) {
      return 'Já tens acesso a todas as aulas.';
    }
    if (pkgId === 'intermedio' && availableCount < 7) {
      return `Só restam ${availableCount} aula${availableCount === 1 ? '' : 's'} disponíveis.`;
    }
    return undefined;
  };

  const handleCheckout = async (packageId: GroupClassPackageId) => {
    setCheckoutError('');

    // Avulsa and intermedio go through the selection page
    if (packageId === 'intermedio' || packageId === 'avulsa') {
      router.push(`/preparacao/selecionar?pacote=${packageId}`);
      return;
    }

    if (!user) {
      router.push(`/login?next=${encodeURIComponent('/preparacao#pacotes')}`);
      return;
    }

    setCheckoutLoading(packageId);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) throw new Error('Sessão inválida. Volta a iniciar sessão.');

      const response = await fetch('/api/checkout/group-classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ schoolYear: GROUP_CLASS_SCHOOL_YEAR, packageId }),
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Erro ao criar pagamento.');
      window.location.href = payload.url;
    } catch (err: any) {
      setCheckoutError(err.message || 'Erro ao iniciar pagamento. Tenta novamente.');
      setCheckoutLoading(null);
    }
  };

  const scrollToPackages = () => packagesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <>
      <Navbar />
      <main className="bg-[#f5f5f5]">

        {/* ── Hero ── */}
        <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-white border-b border-black/10 px-4 pt-24 pb-16">
          <MathRain />
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-black/[0.03] rounded-full blur-3xl" />
          </div>

          <div className={`relative z-10 max-w-4xl mx-auto text-center transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-[#f5f5f5] px-4 py-2 mb-8">
              <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-black uppercase tracking-[0.2em] text-[#111111]">
                Exame Nacional · 22 de junho de 2026
              </span>
            </div>

            <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-[#000000] leading-[1.05] mb-6">
              Preparação Intensiva<br />
              <span className="text-[#3a3a3a]">para o Exame de</span><br />
              Matemática do 9.º ano
            </h1>

            <p className="text-base sm:text-lg text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              15 aulas ao vivo na Skool, gravações incluídas e materiais por tema,
              tudo orientado para o exame com quem tirou <strong className="text-[#000000]">100%</strong> nesse mesmo exame.
            </p>

            <div className="flex flex-wrap gap-3 justify-center mb-10">
              <span className="rounded-full border border-black/15 bg-[#f5f5f5] px-4 py-1.5 text-xs font-semibold text-[#111111]">
                Programa começa a 28 de maio
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <button
                onClick={scrollToPackages}
                className="group relative px-8 py-4 bg-[#000000] text-white font-bold rounded-2xl text-lg shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
              >
                <span className="relative z-10">Garantir a minha vaga</span>
                <div className="absolute inset-0 bg-gradient-to-r from-[#111111] to-[#2a2a2a] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </button>
              <a
                href="#programa"
                className="px-8 py-4 bg-white text-[#111111] font-bold rounded-2xl text-lg border-2 border-black/20 hover:border-black/50 hover:-translate-y-1 transition-all duration-300"
              >
                Ver o programa
              </a>
            </div>

            <div className="rounded-[2rem] border border-black/10 bg-[#f5f5f5] px-8 py-6 inline-block shadow-[0_16px_45px_rgba(0,0,0,0.05)]">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#5a7ca8] mb-4">
                Tempo até ao exame
              </p>
              <Countdown />
              <p className="text-xs text-gray-400 mt-3 font-medium">22 de junho de 2026 · 9h30</p>
            </div>
          </div>
        </section>

        {/* ── Vídeo ── */}
        <section className="px-4 py-20 bg-white border-b border-black/10">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#5a7ca8] mb-4">Vê antes de decidir</p>
            <h2 className="text-3xl sm:text-4xl font-black text-[#000000] mb-8 leading-none">
              Como vai ser a preparação
            </h2>
            <div className="relative w-full aspect-video rounded-[2rem] overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,0.08)]">
              <iframe
                src="https://www.youtube.com/embed/AivRt8MEh2A"
                title="Preparação Intensiva para o Exame de Matemática do 9.º Ano"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              />
            </div>
          </div>
        </section>

        {/* ── Quem é o Alin ── */}
        <section className="px-4 py-20 bg-white border-b border-black/10">
          <div className="max-w-5xl mx-auto">
            <div className="grid lg:grid-cols-[1fr_300px] gap-10 lg:gap-16 items-center">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-[#5a7ca8] mb-4">Quem vai orientar</p>
                <h2 className="text-4xl sm:text-5xl font-black text-[#000000] mb-6 leading-none">O Alin</h2>

                <div className="space-y-4 text-base leading-relaxed text-gray-600">
                  <p>
                    Tirei <strong className="text-[#000000]">100% no Exame Nacional de Matemática do 9.º ano</strong> e sempre tive 5 a Matemática no ensino básico. Neste momento estou no secundário com média de 20 a Matemática.
                  </p>
                  <p>
                    Já passei por este exame, sei o que costuma sair, o que os alunos mais falham e como organizar o estudo nas semanas anteriores. Esta preparação é exatamente o que eu gostaria de ter tido.
                  </p>
                </div>

                <div className="mt-8 grid grid-cols-3 gap-4">
                  {[
                    { value: '100%', label: 'no exame do 9.º' },
                    { value: '5', label: 'sempre a mat.' },
                    { value: '20', label: 'média no secundário' },
                  ].map(({ value, label }) => (
                    <div key={label} className="rounded-2xl border border-black/10 bg-[#f5f5f5] px-4 py-5 text-center">
                      <span className="block text-3xl font-black text-[#000000]">{value}</span>
                      <span className="block text-xs text-gray-500 mt-1 font-medium">{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Alin photo */}
              <div className="relative w-full max-w-[300px] justify-self-center lg:justify-self-end">
                <div className="relative w-full aspect-[3/4] rounded-[2.25rem] overflow-hidden border border-black/10 bg-[#f1f1f1] shadow-[0_24px_60px_rgba(0,0,0,0.08)]">
                  <Image
                    src="/images/preparacao/alin.png"
                    alt="Foto do Alin"
                    fill
                    className="object-contain"
                    sizes="(max-width: 1024px) 100vw, 300px"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Programa ── */}
        <section id="programa" className="px-4 py-20 border-b border-black/10 bg-[#f5f5f5]">
          <div className="max-w-5xl mx-auto">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#5a7ca8] mb-4 text-center">O programa</p>
            <h2 className="text-4xl sm:text-5xl font-black text-[#000000] text-center mb-4 leading-none">
              15 aulas em 3 semanas
            </h2>
            <p className="text-gray-600 text-center mb-12 max-w-xl mx-auto">
              24 de maio a 13 de junho. Tudo orientado para chegares ao exame do dia 22 de junho preparado e confiante.
            </p>

            <div className="grid lg:grid-cols-[1fr_380px] gap-8 items-start">
              {/* What's included */}
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  {
                    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.88v6.24a1 1 0 01-1.447.894L15 14M3 8.5A1.5 1.5 0 014.5 7h7A1.5 1.5 0 0113 8.5v7a1.5 1.5 0 01-1.5 1.5h-7A1.5 1.5 0 013 15.5v-7z" />,
                    title: 'Aulas ao vivo',
                    desc: 'Na Skool, com partilha de ecrã e explicação passo a passo em tempo real',
                  },
                  {
                    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />,
                    title: 'Gravações incluídas',
                    desc: 'Acesso a todas as gravações logo após cada sessão, para reveres ao teu ritmo',
                  },
                  {
                    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
                    title: 'Materiais por tema',
                    desc: 'Fichas e resumos organizados por tema, partilhados antes de cada aula',
                  },
                  {
                    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />,
                    title: 'Comunidade Skool',
                    desc: 'Acesso à plataforma onde decorrem as aulas e onde podes tirar dúvidas',
                  },
                  {
                    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />,
                    title: 'Exercícios de exame',
                    desc: 'Cada aula inclui resolução de exercícios do tipo que costuma sair no exame nacional',
                  },
                  {
                    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />,
                    title: 'Cobertura total',
                    desc: 'Cada aula dedica-se a um tema do programa, com foco nos exercícios que mais saem no exame',
                  },
                ].map(({ icon, title, desc }) => (
                  <div key={title} className="rounded-2xl border border-black/10 bg-white p-5 shadow-[0_16px_45px_rgba(0,0,0,0.05)]">
                    <div className="w-10 h-10 rounded-xl bg-[#f5f5f5] flex items-center justify-center mb-4">
                      <svg className="w-5 h-5 text-[#000000]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {icon}
                      </svg>
                    </div>
                    <h3 className="font-black text-[#000000] mb-1">{title}</h3>
                    <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>

              {/* Calendar */}
              <div className="rounded-[2rem] border border-black/10 bg-white p-5 shadow-[0_24px_60px_rgba(0,0,0,0.06)]">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#5a7ca8] mb-4">
                  Clica numa aula para ver o tema
                </p>
                <PreparacaoCalendar mode="view" />
              </div>
            </div>
          </div>
        </section>

        {/* ── Pacotes ── */}
        <section ref={packagesRef} id="pacotes" className="px-4 py-20 bg-[#f5f5f5] border-b border-black/10">
          <div className="max-w-5xl mx-auto">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#5a7ca8] mb-4 text-center">Entra na preparação</p>
            <h2 className="text-4xl sm:text-5xl font-black text-[#000000] text-center mb-4 leading-none">
              Escolhe o teu pacote
            </h2>
            <p className="text-gray-600 text-center mb-14 max-w-xl mx-auto">
              O exame é no dia 22 de junho. O programa começa no dia 24 de maio.
            </p>

            {checkoutError && (
              <div className="mb-8 mx-auto max-w-lg rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-600 text-center">
                {checkoutError}
              </div>
            )}

            {!user && !authLoading && (
              <div className="mb-8 mx-auto max-w-lg rounded-2xl border border-black/10 bg-white px-5 py-4 text-sm text-center text-gray-600 shadow-sm">
                Ao clicar em qualquer pacote serás redirecionado para{' '}
                <Link href="/login?next=/preparacao" className="font-semibold text-[#000000] underline underline-offset-2">
                  iniciar sessão
                </Link>{' '}
                antes de pagar.
              </div>
            )}

            {/* Order: Avulsa (left), Completo (middle/highlighted), Intermédio (right) */}
            <div className="grid gap-6 lg:grid-cols-3 items-start">
              <PackageCard
                pkg={GROUP_CLASS_PACKAGES['avulsa']}
                onCheckout={handleCheckout}
                loading={checkoutLoading === 'avulsa'}
                disabledReason={getDisabledReason('avulsa')}
              />
              <PackageCard
                pkg={GROUP_CLASS_PACKAGES['completo']}
                onCheckout={handleCheckout}
                loading={checkoutLoading === 'completo'}
                disabledReason={getDisabledReason('completo')}
              />
              <PackageCard
                pkg={GROUP_CLASS_PACKAGES['intermedio']}
                onCheckout={handleCheckout}
                loading={checkoutLoading === 'intermedio'}
                disabledReason={getDisabledReason('intermedio')}
              />
            </div>

            <p className="text-center text-xs text-gray-400 mt-8 font-medium">
              Pagamento seguro via Stripe · Cartão de crédito ou débito
            </p>
          </div>
        </section>

        {/* ── Skool ── */}
        <section className="relative px-4 py-16 bg-[#000000] overflow-hidden">
          {/* Blue glow at top for visual depth */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[280px] bg-[#1a3a6a]/25 blur-[90px] pointer-events-none" />

          <div className="relative max-w-5xl mx-auto">

            {/* Header */}
            <div className="text-center mb-10">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-[#5a7ca8] mb-3">
                Incluído no Pacote Completo
              </p>
              <h2 className="text-4xl sm:text-5xl font-black text-white mb-3 leading-none">
                A Skool da MatemáticaTop
              </h2>
              <p className="text-white/50 max-w-xl mx-auto text-sm leading-relaxed">
                Uma plataforma de estudo que te acompanha agora, antes do exame, e depois, quando entrares no secundário.
              </p>
            </div>

            {/* Row 1: Antes do exame + No secundário */}
            <div className="grid sm:grid-cols-2 gap-4 mb-4">

              {/* Antes do exame */}
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-6">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white/60 mb-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                  Antes do exame
                </span>
                <h3 className="text-lg font-black text-white mb-2">Usa a Skool para o exame</h3>
                <p className="text-sm text-white/55 leading-relaxed mb-4">
                  Não percebeste um tema na aula ao vivo? Queres praticar mais antes do dia 22?
                </p>
                <div className="space-y-2">
                  {[
                    'Revê a gravação de qualquer aula, ao teu ritmo',
                    'Pratica com fichas de exercícios por tema',
                    'Identifica as tuas lacunas antes do exame',
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-2">
                      <svg className="w-3.5 h-3.5 text-white/40 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      <p className="text-xs text-white/50 leading-relaxed">{item}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* No secundário */}
              <div className="rounded-2xl border border-[#5a7ca8]/25 bg-[#5a7ca8]/[0.06] p-6">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#5a7ca8]/20 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#7a9cc8] mb-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#5a7ca8]" />
                  No secundário
                </span>
                <h3 className="text-lg font-black text-white mb-2">O teu companheiro no secundário</h3>
                <p className="text-sm text-white/55 leading-relaxed mb-4">
                  Quando entrares no 10.º ano, a Skool já te espera com conteúdos para o 10.º, 11.º e 12.º ano.
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Vídeos explicativos',
                    'Testes intermédios',
                    'Fichas por tema',
                    'Planos de estudo',
                    'Dicas e ferramentas',
                  ].map((chip) => (
                    <span key={chip} className="rounded-full border border-[#5a7ca8]/25 bg-[#5a7ca8]/10 px-3 py-1 text-xs text-[#7a9cc8] font-medium">
                      {chip}
                    </span>
                  ))}
                </div>
              </div>

            </div>

            {/* Row 2: 4 feature cards */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              {[
                {
                  icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.88v6.24a1 1 0 01-1.447.894L15 14M3 8.5A1.5 1.5 0 014.5 7h7A1.5 1.5 0 0113 8.5v7a1.5 1.5 0 01-1.5 1.5h-7A1.5 1.5 0 013 15.5v-7z" />,
                  title: 'Gravações das aulas',
                  desc: 'Cada aula gravada e organizada por tema, disponível logo após a sessão',
                },
                {
                  icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
                  title: 'Materiais de cada aula',
                  desc: 'Slides e notas para descarregar e estudar offline quando quiseres',
                },
                {
                  icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />,
                  title: 'Fichas de prática',
                  desc: 'Exercícios tipo exame por tema, com valores adaptados para praticares mais',
                },
                {
                  icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />,
                  title: 'Sempre a crescer',
                  desc: 'Novos conteúdos e recursos adicionados ao longo do próximo ano letivo',
                },
              ].map(({ icon, title, desc }) => (
                <div key={title} className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4">
                  <div className="w-8 h-8 rounded-lg bg-white/[0.08] flex items-center justify-center mb-3">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {icon}
                    </svg>
                  </div>
                  <h3 className="font-black text-white text-sm mb-1">{title}</h3>
                  <p className="text-[11px] text-white/45 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>

            {/* Row 3: price + confirmation — highlighted */}
            <div className="rounded-[1.75rem] border border-white/15 bg-white/[0.07] p-1">
              <div className="grid sm:grid-cols-2 gap-1">
                <div className="rounded-[1.4rem] px-7 py-6">
                  <p className="text-[10px] font-black uppercase tracking-wider text-white/40 mb-3">
                    A partir de setembro de 2026
                  </p>
                  <div className="flex items-end gap-2">
                    <span className="text-5xl font-black text-white leading-none">29€</span>
                    <span className="text-white/50 font-semibold mb-1">/ mês</span>
                  </div>
                  <p className="text-sm text-white/45 mt-2 leading-relaxed">
                    Subscrição mensal para novos membros.
                  </p>
                </div>
                <div className="rounded-[1.4rem] bg-white px-7 py-6 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#000000] flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-black text-[#000000] mb-1">Acesso vitalício incluído</p>
                    <p className="text-sm text-gray-500 leading-relaxed">
                      Pacote Completo: acesso para sempre, sem pagar nada a mais quando a subscrição arrancar em setembro.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Garantia ── */}
        <section className="px-4 py-20 bg-white border-b border-black/10">
          <div className="max-w-3xl mx-auto">
            <div className="rounded-[2.25rem] border border-black/10 bg-[#f5f5f5] p-8 sm:p-12 text-center shadow-[0_24px_60px_rgba(0,0,0,0.05)]">
              <div className="w-16 h-16 rounded-full bg-[#000000] flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-[#5a7ca8] mb-4">Garantia de satisfação</p>
              <h2 className="text-3xl sm:text-4xl font-black text-[#000000] mb-2 leading-snug">
                Sem risco para entrares
              </h2>
              <p className="text-sm text-gray-400 mb-6 font-medium">Aplica-se ao Pacote Completo</p>
              <blockquote className="text-lg sm:text-xl text-gray-700 leading-relaxed italic max-w-2xl mx-auto">
                "Se no final da preparação sentires que esta experiência não valeu a pena, basta dizeres-me e devolvo-te o dinheiro sem questões."
              </blockquote>
              <p className="mt-4 text-sm font-bold text-[#000000]">Alin</p>
              <a
                href="/preparacao/reembolso"
                className="inline-block mt-5 text-xs text-gray-400 hover:text-[#000000] underline underline-offset-2 transition-colors"
              >
                Ver termos de devolução
              </a>
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="px-4 py-20 bg-[#f5f5f5] border-b border-black/10">
          <div className="max-w-3xl mx-auto">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#5a7ca8] mb-4 text-center">Perguntas frequentes</p>
            <h2 className="text-4xl sm:text-5xl font-black text-[#000000] text-center mb-12 leading-none">Tens dúvidas?</h2>
            <div className="space-y-4">
              {FAQS.map(({ q, a }) => <FaqItem key={q} q={q} a={a} />)}
            </div>
          </div>
        </section>

        {/* ── CTA final ── */}
        <section className="px-4 py-24 bg-white">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-[#f5f5f5] px-4 py-2 mb-8">
              <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-black uppercase tracking-[0.2em] text-[#111111]">
                Exame a 22 de junho · O programa começa a 28 de maio
              </span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-[#000000] mb-6 leading-none">
              Prepara-te a sério.<br />O exame não espera.
            </h2>
            <p className="text-gray-600 mb-10 max-w-xl mx-auto text-base leading-relaxed">
              Tens menos de um mês. Cada semana conta. Com um plano estruturado e aulas focadas, podes chegar ao dia 22 com confiança.
            </p>
            <button
              onClick={scrollToPackages}
              className="inline-flex items-center justify-center gap-2 px-10 py-5 bg-[#000000] text-white font-bold rounded-2xl text-lg shadow-2xl hover:shadow-[#000000]/30 hover:-translate-y-1 transition-all duration-300"
            >
              Garantir a minha vaga
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
            <p className="text-xs text-gray-400 mt-5 font-medium">Garantia de satisfação (Pacote Completo) · Pagamento seguro via Stripe</p>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
