'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import WaitlistModal from '@/components/correcao/WaitlistModal';

type Area = 'CT' | 'CSE' | 'LH' | 'AV' | 'PRO';

const AREAS: Area[] = ['CT', 'CSE', 'LH', 'AV', 'PRO'];

type Option = { label: string; points: Partial<Record<Area, number>> };
type Question = { id: string; title: string; options: Option[] };

const QUESTIONS: Question[] = [
  {
    id: 'q1',
    title: 'Qual é a tua disciplina preferida agora?',
    options: [
      { label: 'Matemática', points: { CT: 3, CSE: 2 } },
      { label: 'Ciências Naturais / Físico-Química', points: { CT: 3, PRO: 1 } },
      { label: 'Português / Línguas', points: { LH: 3 } },
      { label: 'História / Geografia', points: { LH: 2, CSE: 2 } },
      { label: 'Educação Visual / Artes', points: { AV: 3 } },
      { label: 'TIC', points: { PRO: 2, CT: 1 } },
    ],
  },
  {
    id: 'q2',
    title: 'Em qual tens melhores notas?',
    options: [
      { label: 'Matemática', points: { CT: 3, CSE: 2 } },
      { label: 'Ciências Naturais / Físico-Química', points: { CT: 3, PRO: 1 } },
      { label: 'Português / Línguas', points: { LH: 3 } },
      { label: 'História / Geografia', points: { LH: 2, CSE: 2 } },
      { label: 'Educação Visual / Artes', points: { AV: 3 } },
      { label: 'TIC', points: { PRO: 2, CT: 1 } },
    ],
  },
  {
    id: 'q3',
    title: 'Que atividade te desperta mais interesse?',
    options: [
      { label: 'Resolver problemas e cálculos', points: { CT: 3 } },
      { label: 'Perceber dinheiro, sociedade e atualidade', points: { CSE: 3 } },
      { label: 'Ler, escrever e debater', points: { LH: 3 } },
      { label: 'Desenhar e criar', points: { AV: 3 } },
      { label: 'Trabalhar com as mãos e fazer coisas reais', points: { PRO: 3 } },
    ],
  },
  {
    id: 'q4',
    title: 'Como preferes aprender?',
    options: [
      { label: 'Teoria e raciocínio', points: { CT: 2, LH: 1, CSE: 1 } },
      { label: 'Ambos', points: { CT: 1, CSE: 1, AV: 1 } },
      { label: 'Prática e projetos', points: { PRO: 3, AV: 1 } },
    ],
  },
  {
    id: 'q5',
    title: 'Que futuro te atrai mais?',
    options: [
      { label: 'Saúde, engenharia, tecnologia', points: { CT: 3 } },
      { label: 'Gestão, economia, finanças', points: { CSE: 3 } },
      { label: 'Direito, jornalismo, psicologia', points: { LH: 3 } },
      { label: 'Design, arquitetura, multimédia', points: { AV: 3 } },
      { label: 'Uma profissão técnica especializada', points: { PRO: 3 } },
    ],
  },
  {
    id: 'q6',
    title: 'Depois do secundário, o que imaginas?',
    options: [
      { label: 'Ir para a universidade', points: { CT: 1, CSE: 1, LH: 1, AV: 1 } },
      { label: 'Trabalhar logo', points: { PRO: 3 } },
    ],
  },
  {
    id: 'q7',
    title: 'Qual é a tua relação com a Matemática?',
    options: [
      { label: 'Gosto', points: { CT: 3, CSE: 2 } },
      { label: 'Não gosto nem desgosto', points: { CSE: 1, PRO: 1, AV: 1 } },
      { label: 'Não gosto', points: { LH: 2, AV: 1 } },
    ],
  },
  {
    id: 'q8',
    title: 'Qual é a tua relação com a escrita e as línguas?',
    options: [
      { label: 'Gosto', points: { LH: 3 } },
      { label: 'Não gosto nem desgosto', points: { CSE: 1, CT: 1 } },
      { label: 'Não gosto', points: { CT: 1, PRO: 1 } },
    ],
  },
];

const AREA_INFO: Record<
  Area,
  { name: string; emoji: string; desc: string; disciplines: string[]; careers: string[] }
> = {
  CT: {
    name: 'Ciências e Tecnologias',
    emoji: '🔬',
    desc: 'Para quem gosta de matemática, ciências e de resolver problemas.',
    disciplines: ['Matemática A', 'Física e Química A', 'Biologia e Geologia'],
    careers: ['Medicina', 'Engenharias', 'Informática', 'Saúde'],
  },
  CSE: {
    name: 'Ciências Socioeconómicas',
    emoji: '📈',
    desc: 'Para quem se interessa por economia, sociedade e números aplicados ao mundo real.',
    disciplines: ['Matemática A', 'Economia A', 'Geografia A'],
    careers: ['Gestão', 'Economia', 'Finanças'],
  },
  LH: {
    name: 'Línguas e Humanidades',
    emoji: '📚',
    desc: 'Para quem gosta de ler, escrever, línguas e história.',
    disciplines: ['História A', 'Geografia A/MACS/Língua Estrangeira'],
    careers: ['Direito', 'Jornalismo', 'Psicologia'],
  },
  AV: {
    name: 'Artes Visuais',
    emoji: '🎨',
    desc: 'Para quem é criativo e pensa de forma visual.',
    disciplines: ['Desenho A', 'Geometria Descritiva A', 'História da Cultura e das Artes'],
    careers: ['Arquitetura', 'Design', 'Belas-Artes'],
  },
  PRO: {
    name: 'Cursos Profissionais',
    emoji: '🛠️',
    desc: 'Para quem prefere aprendizagem prática e trabalhar mais cedo.',
    disciplines: ['Componente técnica + estágio (ex.: Informática, Gestão, Desporto)'],
    careers: ['Certificado profissional'],
  },
};

// Máximo de pontos que cada área pode obter (a melhor resposta de cada pergunta
// para essa área). Serve de denominador da afinidade, para nenhuma área sair
// prejudicada por aparecer em menos perguntas.
function computeMaxes(): Record<Area, number> {
  const maxes: Record<Area, number> = { CT: 0, CSE: 0, LH: 0, AV: 0, PRO: 0 };
  QUESTIONS.forEach((q) => {
    AREAS.forEach((a) => {
      const best = Math.max(0, ...q.options.map((o) => o.points[a] || 0));
      maxes[a] += best;
    });
  });
  return maxes;
}

function computeResults(answers: (number | null)[]) {
  const totals: Record<Area, number> = { CT: 0, CSE: 0, LH: 0, AV: 0, PRO: 0 };
  answers.forEach((optIdx, qIdx) => {
    if (optIdx == null) return;
    const pts = QUESTIONS[qIdx].options[optIdx].points;
    (Object.keys(pts) as Area[]).forEach((a) => {
      totals[a] += pts[a] || 0;
    });
  });
  const maxes = computeMaxes();
  return AREAS.map((a) => ({
    area: a,
    pct: maxes[a] ? Math.round((totals[a] / maxes[a]) * 100) : 0,
  })).sort((x, y) => y.pct - x.pct);
}

export default function Quiz() {
  const [phase, setPhase] = useState<'intro' | 'quiz' | 'result'>('intro');
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(() => Array(QUESTIONS.length).fill(null));
  const [modalOpen, setModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const ranked = useMemo(() => (phase === 'result' ? computeResults(answers) : null), [phase, answers]);

  const start = () => {
    setPhase('quiz');
    setCurrent(0);
  };

  const choose = (optIdx: number) => {
    const next = [...answers];
    next[current] = optIdx;
    setAnswers(next);
    if (current < QUESTIONS.length - 1) {
      setCurrent(current + 1);
    } else {
      // Última pergunta respondida: mostra o pop-up antes do resultado.
      setModalOpen(true);
    }
  };

  const goBack = () => {
    if (current > 0) setCurrent(current - 1);
  };

  const revealResult = () => {
    setModalOpen(false);
    setPhase('result');
  };

  const restart = () => {
    setAnswers(Array(QUESTIONS.length).fill(null));
    setCurrent(0);
    setPhase('intro');
  };

  if (phase === 'intro') {
    return (
      <div className="rounded-2xl border border-black/15 bg-white p-6 sm:p-10 text-center shadow-sm">
        <span className="inline-flex items-center gap-2 rounded-full border border-[#f59e0b]/40 bg-[#fff7ed] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#b45309]">
          Teste de orientação · 9.º ano
        </span>
        <h2 className="mt-4 text-2xl sm:text-3xl font-black text-[#000000]">
          Descobre a tua afinidade com cada área do secundário
        </h2>
        <p className="mt-3 text-gray-600 max-w-xl mx-auto text-sm sm:text-base">
          Responde a 8 perguntas rápidas sobre os teus interesses e o teu à-vontade com as
          disciplinas. No fim, mostramos a tua afinidade com cada área e explicamos o porquê.
        </p>
        <button
          type="button"
          onClick={start}
          className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl bg-[#000000] px-9 py-4 text-lg font-black text-white shadow-lg shadow-black/25 transition hover:bg-[#1a1a1a] hover:scale-[1.02]"
        >
          Começar →
        </button>
        <p className="mt-4 text-xs text-gray-400">
          Demora cerca de 1 minuto. É só uma ferramenta de orientação, não um veredito.
        </p>
      </div>
    );
  }

  if (phase === 'quiz') {
    const q = QUESTIONS[current];
    const progress = Math.round(((current + 1) / QUESTIONS.length) * 100);
    return (
      <div className="rounded-2xl border border-black/15 bg-white p-6 sm:p-8 shadow-sm">
        <div className="mb-5">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
            <span>
              Pergunta {current + 1} de {QUESTIONS.length}
            </span>
            <span>{progress}%</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-black/10">
            <div className="h-full rounded-full bg-[#000000] transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <h2 className="text-xl sm:text-2xl font-black text-[#000000]">{q.title}</h2>

        <div className="mt-5 space-y-2.5">
          {q.options.map((opt, i) => {
            const selected = answers[current] === i;
            return (
              <button
                key={opt.label}
                type="button"
                onClick={() => choose(i)}
                className={`w-full rounded-xl border px-4 py-3.5 text-left text-sm sm:text-base font-medium transition ${
                  selected
                    ? 'border-black bg-[#000000] text-white'
                    : 'border-black/15 bg-white text-[#111111] hover:border-black hover:bg-black/[0.03]'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {current > 0 && (
          <button
            type="button"
            onClick={goBack}
            className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 transition hover:text-black"
          >
            ← Voltar
          </button>
        )}

        <WaitlistModal
          open={modalOpen}
          mode="funnel"
          source="secundario"
          funnelLabel="Ver o meu resultado →"
          onClose={revealResult}
          onJoined={revealResult}
          onSkip={revealResult}
        />
      </div>
    );
  }

  // Resultado
  const results = ranked || [];
  const top = results[0];
  const second = results[1];
  const tie = !!second && top.pct - second.pct <= 5 && second.pct > 0;
  const topInfo = AREA_INFO[top.area];

  const shareResult = async () => {
    const url = `${window.location.origin}/secundario`;
    const text = `A minha maior afinidade para o secundário é ${topInfo.name} (${top.pct}%)! Descobre a tua área:`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: 'Que área do secundário é a tua?', text, url });
        return;
      } catch (err) {
        // Se a pessoa cancelou a partilha, não fazemos fallback.
        if ((err as Error)?.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Ambientes sem clipboard: ignora silenciosamente.
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border-2 border-[#16a34a]/40 bg-[#f0fdf4] p-6 sm:p-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#15803d]">
          A tua maior afinidade
        </p>
        <div className="mt-2 text-5xl">{topInfo.emoji}</div>
        <h2 className="mt-2 text-2xl sm:text-3xl font-black text-[#000000]">{topInfo.name}</h2>
        <p className="mt-1 text-3xl font-black text-[#15803d]">{top.pct}% de afinidade</p>
        <p className="mt-3 text-sm sm:text-base text-gray-700 max-w-xl mx-auto">{topInfo.desc}</p>

        {tie && (
          <p className="mt-4 inline-block rounded-xl border border-[#f59e0b]/40 bg-[#fff7ed] px-4 py-2 text-sm font-medium text-[#b45309]">
            Empate técnico com <strong>{AREA_INFO[second.area].name}</strong> ({second.pct}%). As duas
            combinam contigo, por isso vê bem as disciplinas de cada uma.
          </p>
        )}

        <div className="mt-5 grid gap-3 sm:grid-cols-2 text-left">
          <div className="rounded-xl border border-black/10 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Disciplinas-chave
            </p>
            <ul className="mt-1.5 space-y-1 text-sm text-[#111111]">
              {topInfo.disciplines.map((d) => (
                <li key={d}>• {d}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-black/10 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Abre portas a</p>
            <ul className="mt-1.5 space-y-1 text-sm text-[#111111]">
              {topInfo.careers.map((c) => (
                <li key={c}>• {c}</li>
              ))}
            </ul>
          </div>
        </div>

        <button
          type="button"
          onClick={shareResult}
          className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-[#000000] px-6 py-3 text-base font-bold text-white transition hover:bg-[#1a1a1a]"
        >
          {copied ? '✓ Link copiado!' : '📲 Partilhar o meu resultado'}
        </button>
      </div>

      <div className="rounded-2xl border border-black/15 bg-white p-6 sm:p-8 shadow-sm">
        <h3 className="text-lg font-black text-[#000000]">A tua afinidade com cada área</h3>
        <div className="mt-4 space-y-3">
          {results.map((r) => {
            const info = AREA_INFO[r.area];
            return (
              <div key={r.area}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-[#111111]">
                    {info.emoji} {info.name}
                  </span>
                  <span className="font-bold text-[#111111]">{r.pct}%</span>
                </div>
                <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-black/10">
                  <div
                    className="h-full rounded-full bg-[#000000] transition-all"
                    style={{ width: `${r.pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <p className="rounded-xl border border-black/10 bg-gray-50 px-4 py-3 text-center text-xs text-gray-500">
        Esta é uma ferramenta de orientação para te ajudar a refletir, não um veredito. Fala também
        com os teus professores e a tua família antes de decidires.
      </p>

      <div className="rounded-2xl border border-black/15 bg-gray-50 p-6 text-center">
        <h3 className="text-lg sm:text-xl font-black text-[#000000]">As Explicações Top estão a chegar</h3>
        <p className="mt-2 text-sm text-gray-600 max-w-md mx-auto">
          Vamos abrir explicações de qualidade para praticamente todas as disciplinas e áreas do
          secundário. Entra na lista de espera e és das primeiras pessoas a saber.
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/explicacoes-top"
            className="inline-flex items-center justify-center rounded-xl bg-[#000000] px-6 py-3 text-base font-bold text-white transition hover:bg-[#1a1a1a]"
          >
            Entrar na lista de espera →
          </Link>
          <button
            type="button"
            onClick={restart}
            className="inline-flex items-center justify-center rounded-xl border-2 border-black bg-white px-6 py-3 text-base font-bold text-black transition hover:bg-black hover:text-white"
          >
            Refazer o teste
          </button>
        </div>
      </div>
    </div>
  );
}
