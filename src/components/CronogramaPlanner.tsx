'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import DiscordInviteCard from '@/components/DiscordInviteCard';
import { createClient } from '@/lib/supabase';

const EXAM_DATE_LABEL = '23 de junho';

const DIFFICULTY_TOPICS = [
  'Funções',
  'Geometria',
  'Trigonometria',
  'Probabilidades e combinatória',
  'Sucessões',
  'Números complexos',
] as const;

const STUDY_START_OPTIONS = [
  '3 meses antes',
  '2 meses antes',
  '1 mês antes',
  '2 semanas antes',
] as const;

type DifficultyTopic = (typeof DIFFICULTY_TOPICS)[number];
type StudyStartOption = (typeof STUDY_START_OPTIONS)[number];

type CronogramaEntry = {
  title: string;
  filePath?: string;
};

const CRONOGRAMA_FILE_MAP: Record<StudyStartOption, Record<DifficultyTopic, string>> = {
  '3 meses antes': {
    Funções: '/cronogramas/cronograma_3m_funcoes.pdf',
    Geometria: '/cronogramas/cronograma_3m_geometria.pdf',
    Trigonometria: '/cronogramas/cronograma_3m_trigo.pdf',
    'Probabilidades e combinatória': '/cronogramas/cronograma_3m_prob_comb.pdf',
    Sucessões: '/cronogramas/cronograma_3m_sucessoes.pdf',
    'Números complexos': '/cronogramas/cronograma_3m_complexos.pdf',
  },
  '2 meses antes': {
    Funções: '/cronogramas/cronograma_2m_funcoes.pdf',
    Geometria: '/cronogramas/cronograma_2m_geometria.pdf',
    Trigonometria: '/cronogramas/cronograma_2m_trigo.pdf',
    'Probabilidades e combinatória': '/cronogramas/cronograma_2m_prob_comb.pdf',
    Sucessões: '/cronogramas/cronograma_2m_sucessoes.pdf',
    'Números complexos': '/cronogramas/cronograma_2m_complexos.pdf',
  },
  '1 mês antes': {
    Funções: '/cronogramas/cronograma_1m_funcoes.pdf',
    Geometria: '/cronogramas/cronograma_1m_geometria.pdf',
    Trigonometria: '/cronogramas/cronograma_1m_trigo.pdf',
    'Probabilidades e combinatória': '/cronogramas/cronograma_1m_prob_comb.pdf',
    Sucessões: '/cronogramas/cronograma_1m_sucessoes.pdf',
    'Números complexos': '/cronogramas/cronograma_1m_complexos.pdf',
  },
  '2 semanas antes': {
    Funções: '/cronogramas/cronograma_2s.pdf',
    Geometria: '/cronogramas/cronograma_2s.pdf',
    Trigonometria: '/cronogramas/cronograma_2s.pdf',
    'Probabilidades e combinatória': '/cronogramas/cronograma_2s.pdf',
    Sucessões: '/cronogramas/cronograma_2s.pdf',
    'Números complexos': '/cronogramas/cronograma_2s.pdf',
  },
};

const PRESET_CRONOGRAMS: Partial<Record<StudyStartOption, Partial<Record<DifficultyTopic, CronogramaEntry>>>> =
  (Object.keys(CRONOGRAMA_FILE_MAP) as StudyStartOption[]).reduce(
    (acc, studyStart) => {
      const topics = CRONOGRAMA_FILE_MAP[studyStart];
      acc[studyStart] = (Object.keys(topics) as DifficultyTopic[]).reduce(
        (topicAcc, topic) => {
          topicAcc[topic] = {
            title: `Cronograma de ${topic} · ${studyStart}`,
            filePath: topics[topic],
          };
          return topicAcc;
        },
        {} as Partial<Record<DifficultyTopic, CronogramaEntry>>,
      );
      return acc;
    },
    {} as Partial<Record<StudyStartOption, Partial<Record<DifficultyTopic, CronogramaEntry>>>>,
  );

function getCronograma(
  studyStart: StudyStartOption,
  topic: DifficultyTopic,
): CronogramaEntry | null {
  if (studyStart === '2 semanas antes') {
    return {
      title: `Cronograma intensivo · ${studyStart}`,
      filePath: '/cronogramas/cronograma_2s.pdf',
    };
  }

  return PRESET_CRONOGRAMS[studyStart]?.[topic] || null;
}

function isMissingSessionError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const maybeError = error as Record<string, unknown>;
  const message = `${String(maybeError.message || '')} ${String(maybeError.name || '')}`.toLowerCase();
  return (
    message.includes('auth session missing') ||
    message.includes('session missing') ||
    message.includes('refresh token') ||
    message.includes('invalid refresh token')
  );
}

export default function CronogramaPlanner() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<any>(null);
  const [selectedTopic, setSelectedTopic] = useState<DifficultyTopic | ''>('');
  const [selectedStudyStart, setSelectedStudyStart] = useState<StudyStartOption | ''>('');
  const [error, setError] = useState('');
  const [shownCronograma, setShownCronograma] = useState<CronogramaEntry | null>(null);
  const [selectionSummary, setSelectionSummary] = useState<string | null>(null);

  const isTwoWeeksSelected = selectedStudyStart === '2 semanas antes';

  const canGenerate = useMemo(() => {
    if (!selectedStudyStart) return false;
    if (isTwoWeeksSelected) return true;
    return Boolean(selectedTopic);
  }, [isTwoWeeksSelected, selectedStudyStart, selectedTopic]);

  useEffect(() => {
    let cancelled = false;

    const checkAuth = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      let activeUser = sessionData.session?.user ?? null;

      if (!activeUser) {
        const { data: userData, error } = await supabase.auth.getUser();
        if (!error || !isMissingSessionError(error)) {
          activeUser = userData.user ?? null;
        }
      }

      if (!cancelled) {
        setUser(activeUser);
      }
    };

    void checkAuth();

    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const handleShowCronograma = () => {
    setError('');

    if (!selectedStudyStart) {
      setError('Seleciona a altura em que vais começar a estudar.');
      return;
    }

    if (!isTwoWeeksSelected && !selectedTopic) {
      setError('Seleciona o tema com mais dificuldade.');
      return;
    }

    if (!user) {
      router.push('/login?next=/exames-nacionais/cronogramas');
      return;
    }

    const topicForLookup = (isTwoWeeksSelected ? 'Funções' : selectedTopic) as DifficultyTopic;
    const cronograma = getCronograma(selectedStudyStart, topicForLookup);
    setShownCronograma(cronograma);
    setSelectionSummary(
      isTwoWeeksSelected ? selectedStudyStart : `${selectedTopic} · ${selectedStudyStart}`,
    );

    if (!cronograma) {
      setError('Não foi possível carregar o cronograma para esta combinação. Tenta novamente.');
    }
  };

  return (
    <div className="grid lg:grid-cols-[1.08fr_0.92fr] gap-6">
      <section className="bg-white rounded-[2rem] border border-black/10 shadow-[0_24px_60px_rgba(0,0,0,0.08)] p-6 sm:p-8">
        <div className="mb-6">
          <h2 className="text-2xl font-black text-[#111111] mb-2">Criar cronograma</h2>
          <p className="text-sm leading-relaxed text-gray-600">
            Escolhe a altura em que vais começar a estudar e o tema em que sentes mais dificuldade.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Data do exame</label>
            <div className="w-full rounded-2xl border border-black/10 bg-[#f7f9fc] px-4 py-3 text-sm font-semibold text-[#111111]">
              {EXAM_DATE_LABEL}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Altura em que vais começar a estudar
            </label>
            <select
              value={selectedStudyStart}
              onChange={(event) => {
                const value = event.target.value as StudyStartOption | '';
                setSelectedStudyStart(value);
                if (value === '2 semanas antes') {
                  setSelectedTopic('');
                }
              }}
              className="w-full rounded-2xl border border-black/10 bg-[#f7f9fc] px-4 py-3 text-sm text-[#111111] outline-none transition-all focus:border-[#3f6c93] focus:ring-2 focus:ring-[#3f6c93]/20"
            >
              <option value="">Seleciona a opção</option>
              {STUDY_START_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tema com mais dificuldade</label>
            <select
              value={selectedTopic}
              onChange={(event) => setSelectedTopic(event.target.value as DifficultyTopic | '')}
              disabled={isTwoWeeksSelected}
              className="w-full rounded-2xl border border-black/10 bg-[#f7f9fc] px-4 py-3 text-sm text-[#111111] outline-none transition-all focus:border-[#3f6c93] focus:ring-2 focus:ring-[#3f6c93]/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="">
                {isTwoWeeksSelected ? 'Não aplicável para 2 semanas' : 'Seleciona o tema'}
              </option>
              {DIFFICULTY_TOPICS.map((topic) => (
                <option key={topic} value={topic}>
                  {topic}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleShowCronograma}
            disabled={!canGenerate}
            className="w-full rounded-2xl bg-[#111111] px-5 py-3.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-[0_20px_45px_rgba(17,17,17,0.18)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Ver cronograma
          </button>

          {error && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              {error}
            </div>
          )}
        </div>
      </section>

      <section className="bg-white rounded-[2rem] border border-black/10 shadow-[0_24px_60px_rgba(0,0,0,0.08)] p-6 sm:p-8 h-fit">
        <div className="mb-6">
          <h2 className="text-2xl font-black text-[#111111] mb-2">Cronograma</h2>
          <p className="text-sm leading-relaxed text-gray-600">
            {selectionSummary
              ? `Combinação selecionada: ${selectionSummary}`
              : 'O cronograma aparece aqui depois de selecionares as opções.'}
          </p>
        </div>

        {!shownCronograma ? (
          <div className="rounded-[1.75rem] border border-dashed border-black/15 bg-[#fafafa] px-6 py-8 text-center text-sm text-gray-500">
            Seleciona o tema e a altura de início para ver o cronograma.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-[1.5rem] border border-black/10 bg-[#fafafa] px-5 py-4">
              <p className="text-lg font-bold text-[#111111]">{shownCronograma.title}</p>
            </div>

            {shownCronograma.filePath && (
              <a
                href={shownCronograma.filePath}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-2xl bg-[#111111] px-5 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-[0_20px_45px_rgba(17,17,17,0.18)]"
              >
                Abrir PDF
              </a>
            )}
          </div>
        )}

        <DiscordInviteCard
          title="Junta-te à comunidade enquanto preparas o exame"
          description="Entra no Discord para acompanhar novidades, recursos e conversas sobre preparação para Matemática A."
          className="mt-6 bg-white/90 text-[#111111]"
        />
      </section>
    </div>
  );
}
