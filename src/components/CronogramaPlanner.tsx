'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import DiscordInviteCard from '@/components/DiscordInviteCard';
import { createClient } from '@/lib/supabase';

const EXAM_DATE_LABELS = {
  matematicaA: '23 de junho',
  nonoAno: '22 de abril',
} as const;

const STUDY_START_OPTIONS_MAT_A = [
  '3 meses antes',
  '2 meses antes',
  '1 mês antes',
  '2 semanas antes',
] as const;

const DIFFICULTY_TOPICS_MAT_A = [
  'Funções',
  'Geometria',
  'Trigonometria',
  'Probabilidades e combinatória',
  'Sucessões',
  'Números complexos',
] as const;

const STUDY_START_OPTIONS_9ANO = [
  '2 meses antes',
  '1 mês antes',
  '2 semanas antes',
] as const;

const DIFFICULTY_TOPICS_9ANO = [
  'Números reais',
  'Álgebra',
  'Geometria',
  'Probabilidades e estatística',
] as const;

type CronogramaTrack = 'matematicaA' | 'nonoAno';
type StudyStartMatA = (typeof STUDY_START_OPTIONS_MAT_A)[number];
type DifficultyTopicMatA = (typeof DIFFICULTY_TOPICS_MAT_A)[number];
type StudyStart9Ano = (typeof STUDY_START_OPTIONS_9ANO)[number];
type DifficultyTopic9Ano = (typeof DIFFICULTY_TOPICS_9ANO)[number];
type StudyStartOption = StudyStartMatA | StudyStart9Ano;
type DifficultyTopic = DifficultyTopicMatA | DifficultyTopic9Ano;

type CronogramaEntry = {
  title: string;
  filePath?: string;
};

const CRONOGRAMA_FILE_MAP_MAT_A: Record<StudyStartMatA, Record<DifficultyTopicMatA, string>> = {
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

const CRONOGRAMA_FILE_MAP_9ANO: Record<StudyStart9Ano, Record<DifficultyTopic9Ano, string>> = {
  '2 meses antes': {
    'Números reais': '/cronogramas/cronograma_9ano_2m_nreais.pdf',
    Álgebra: '/cronogramas/cronograma_9ano_2m_algebra.pdf',
    Geometria: '/cronogramas/cronograma_9ano_2m_geo.pdf',
    'Probabilidades e estatística': '/cronogramas/cronograma_9ano_2m_dados.pdf',
  },
  '1 mês antes': {
    'Números reais': '/cronogramas/cronograma_9ano_1m_nreais.pdf',
    Álgebra: '/cronogramas/cronograma_9ano_1m_algebra.pdf',
    Geometria: '/cronogramas/cronograma_9ano_1m_geo.pdf',
    'Probabilidades e estatística': '/cronogramas/cronograma_9ano_1m_dados.pdf',
  },
  '2 semanas antes': {
    'Números reais': '/cronogramas/cronograma_9ano_2s.pdf',
    Álgebra: '/cronogramas/cronograma_9ano_2s.pdf',
    Geometria: '/cronogramas/cronograma_9ano_2s.pdf',
    'Probabilidades e estatística': '/cronogramas/cronograma_9ano_2s.pdf',
  },
};

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

function getCronograma(track: CronogramaTrack, studyStart: StudyStartOption, topic: DifficultyTopic): CronogramaEntry | null {
  if (track === 'matematicaA') {
    const typedStudyStart = studyStart as StudyStartMatA;
    const typedTopic = (typedStudyStart === '2 semanas antes' ? 'Funções' : topic) as DifficultyTopicMatA;
    const filePath = CRONOGRAMA_FILE_MAP_MAT_A[typedStudyStart]?.[typedTopic];

    if (!filePath) return null;

    return {
      title:
        typedStudyStart === '2 semanas antes'
          ? `Cronograma intensivo · ${typedStudyStart}`
          : `Cronograma de ${typedTopic} · ${typedStudyStart}`,
      filePath,
    };
  }

  const typedStudyStart = studyStart as StudyStart9Ano;
  const typedTopic = (typedStudyStart === '2 semanas antes' ? 'Números reais' : topic) as DifficultyTopic9Ano;
  const filePath = CRONOGRAMA_FILE_MAP_9ANO[typedStudyStart]?.[typedTopic];

  if (!filePath) return null;

  return {
    title:
      typedStudyStart === '2 semanas antes'
        ? `Cronograma intensivo 9.º ano · ${typedStudyStart}`
        : `Cronograma de ${typedTopic} · ${typedStudyStart}`,
    filePath,
  };
}

export default function CronogramaPlanner() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<any>(null);
  const [selectedTrack, setSelectedTrack] = useState<CronogramaTrack | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<DifficultyTopic | ''>('');
  const [selectedStudyStart, setSelectedStudyStart] = useState<StudyStartOption | ''>('');
  const [error, setError] = useState('');
  const [shownCronograma, setShownCronograma] = useState<CronogramaEntry | null>(null);
  const [selectionSummary, setSelectionSummary] = useState<string | null>(null);

  const currentStudyStartOptions = selectedTrack === 'nonoAno' ? STUDY_START_OPTIONS_9ANO : STUDY_START_OPTIONS_MAT_A;
  const currentDifficultyTopics = selectedTrack === 'nonoAno' ? DIFFICULTY_TOPICS_9ANO : DIFFICULTY_TOPICS_MAT_A;
  const isTwoWeeksSelected = selectedStudyStart === '2 semanas antes';

  const canGenerate = useMemo(() => {
    if (!selectedTrack || !selectedStudyStart) return false;
    if (isTwoWeeksSelected) return true;
    return Boolean(selectedTopic);
  }, [isTwoWeeksSelected, selectedStudyStart, selectedTopic, selectedTrack]);

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

  const handleSelectTrack = (track: CronogramaTrack) => {
    setSelectedTrack(track);
    setSelectedTopic('');
    setSelectedStudyStart('');
    setShownCronograma(null);
    setSelectionSummary(null);
    setError('');
  };

  const handleShowCronograma = () => {
    setError('');

    if (!selectedTrack) {
      setError('Seleciona primeiro a opção de cronogramas que queres abrir.');
      return;
    }

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

    const fallbackTopic = selectedTrack === 'nonoAno' ? 'Números reais' : 'Funções';
    const topicForLookup = (isTwoWeeksSelected ? fallbackTopic : selectedTopic) as DifficultyTopic;
    const cronograma = getCronograma(selectedTrack, selectedStudyStart, topicForLookup);
    setShownCronograma(cronograma);
    setSelectionSummary(
      isTwoWeeksSelected
        ? `${selectedTrack === 'nonoAno' ? '9.º ano' : 'Matemática A'} · ${selectedStudyStart}`
        : `${selectedTrack === 'nonoAno' ? '9.º ano' : 'Matemática A'} · ${selectedTopic} · ${selectedStudyStart}`,
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
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Disciplina</label>
            <select
              value={selectedTrack || ''}
              onChange={(event) => {
                const value = event.target.value;
                if (!value) {
                  setSelectedTrack(null);
                  setSelectedTopic('');
                  setSelectedStudyStart('');
                  setShownCronograma(null);
                  setSelectionSummary(null);
                  setError('');
                  return;
                }

                handleSelectTrack(value as CronogramaTrack);
              }}
              className="w-full rounded-2xl border border-black/10 bg-[#f7f9fc] px-4 py-3 text-sm text-[#111111] outline-none transition-all focus:border-[#3f6c93] focus:ring-2 focus:ring-[#3f6c93]/20"
            >
              <option value="">Seleciona a disciplina</option>
              <option value="matematicaA">Matemática A</option>
              <option value="nonoAno">Matemática 9.º ano</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Data do exame</label>
            <div className="w-full rounded-2xl border border-black/10 bg-[#f7f9fc] px-4 py-3 text-sm font-semibold text-[#111111]">
              {selectedTrack ? EXAM_DATE_LABELS[selectedTrack] : 'Seleciona primeiro a disciplina'}
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
              disabled={!selectedTrack}
              className="w-full rounded-2xl border border-black/10 bg-[#f7f9fc] px-4 py-3 text-sm text-[#111111] outline-none transition-all focus:border-[#3f6c93] focus:ring-2 focus:ring-[#3f6c93]/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="">Seleciona a opção</option>
              {currentStudyStartOptions.map((option) => (
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
              disabled={!selectedTrack || isTwoWeeksSelected}
              className="w-full rounded-2xl border border-black/10 bg-[#f7f9fc] px-4 py-3 text-sm text-[#111111] outline-none transition-all focus:border-[#3f6c93] focus:ring-2 focus:ring-[#3f6c93]/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="">
                {!selectedTrack
                  ? 'Seleciona primeiro a disciplina'
                  : isTwoWeeksSelected
                    ? 'Não aplicável para 2 semanas'
                    : 'Seleciona o tema'}
              </option>
              {currentDifficultyTopics.map((topic) => (
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
            Seleciona a disciplina, o tema e a altura de início para ver o cronograma.
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
          description="Entra no Discord para acederes a uma comunidade onde podes esclarecer as tuas dúvidas e conversar com outras pessoas que vão fazer exame."
          className="mt-6 bg-white/90 text-[#111111]"
        />
      </section>
    </div>
  );
}
