'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MathRain from '@/components/MathRain';
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

export default function CronogramaPage() {
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
      let user = sessionData.session?.user ?? null;

      if (!user) {
        const { data: userData, error } = await supabase.auth.getUser();
        if (!error || !isMissingSessionError(error)) {
          user = userData.user ?? null;
        }
      }

      if (cancelled) return;

      setUser(user);
    };

    checkAuth();
    return () => {
      cancelled = true;
    };
  }, [router, supabase]);

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
      router.push('/login?next=/cronograma');
      return;
    }

    const topicForLookup = (isTwoWeeksSelected ? 'Funções' : selectedTopic) as DifficultyTopic;
    const cronograma = getCronograma(selectedStudyStart, topicForLookup);
    setShownCronograma(cronograma);
    setSelectionSummary(
      isTwoWeeksSelected ? selectedStudyStart : `${selectedTopic} · ${selectedStudyStart}`,
    );

    if (!cronograma) {
      setError(
        'Não foi possível carregar o cronograma para esta combinação. Tenta novamente.',
      );
    }
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#f5f5f5]">
        <div className="relative bg-white border-b border-black/15 px-4 pb-12 pt-32 overflow-hidden">
          <MathRain speed="fast" />
          <div className="relative z-10 max-w-4xl mx-auto text-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-[#000000] mb-2">Cronograma</h1>
            <p className="text-gray-600">
              Acede ao teu plano de preparação para o exame.
            </p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-10 grid lg:grid-cols-[1.1fr_1fr] gap-6">
          <section className="bg-white rounded-2xl shadow-md p-6">
            <h2 className="text-xl font-bold text-[#000000] mb-1">Criar cronograma</h2>
            <p className="text-sm text-gray-500 mb-5">
              O cronograma é escolhido com base nas tuas maiores dificuldades e na altura em que vais começar a estudar.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Data do exame</label>
                <div className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-[#f5f5f5] text-sm font-semibold text-[#000000]">
                  {EXAM_DATE_LABEL}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Altura em que vais começar a estudar
                </label>
                <select
                  value={selectedStudyStart}
                  onChange={(e) => {
                    const value = e.target.value as StudyStartOption | '';
                    setSelectedStudyStart(value);
                    if (value === '2 semanas antes') {
                      setSelectedTopic('');
                    }
                  }}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-[#f5f5f5] text-sm focus:ring-2 focus:ring-[#000000] focus:border-transparent outline-none"
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
                  onChange={(e) => setSelectedTopic(e.target.value as DifficultyTopic | '')}
                  disabled={isTwoWeeksSelected}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-[#f5f5f5] text-sm focus:ring-2 focus:ring-[#000000] focus:border-transparent outline-none"
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
                onClick={handleShowCronograma}
                disabled={!canGenerate}
                className="w-full py-3.5 bg-[#000000] text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Ver cronograma
              </button>

              {error && (
                <div className="bg-amber-50 border border-amber-200 text-amber-700 rounded-xl px-4 py-3 text-sm">
                  {error}
                </div>
              )}
            </div>
          </section>

          <section className="bg-white rounded-2xl shadow-md p-6 h-fit">
            <h2 className="text-xl font-bold text-[#000000] mb-1">Cronograma</h2>
            <p className="text-sm text-gray-500 mb-5">
              {selectionSummary
                ? `Combinação selecionada: ${selectionSummary}`
                : 'O cronograma aparece aqui depois de selecionares as opções.'}
            </p>

            {!shownCronograma ? (
              <div className="rounded-xl border border-dashed border-gray-300 bg-[#fafafa] p-6 text-sm text-gray-500 text-center">
                Seleciona o tema e a altura de início para ver o cronograma.
              </div>
            ) : (
              <div className="space-y-3">
                <div className="rounded-xl bg-[#fafafa] border border-[#000000]/20 px-4 py-3">
                  <p className="text-sm font-bold text-[#000000]">{shownCronograma.title}</p>
                </div>

                {shownCronograma.filePath && (
                  <a
                    href={shownCronograma.filePath}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#000000] text-white text-sm font-semibold hover:shadow-lg transition-all"
                  >
                    Abrir PDF
                  </a>
                )}

              </div>
            )}

            <DiscordInviteCard
              title="Junta-te à nossa comunidade enquanto preparas o exame"
              description="Entra no server do Discord para acompanhar novidades e recursos que te podem ajudar na preparação para o exame e esclarece dúvidas com os membros da comunidade."
              className="mt-6"
            />
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
