'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MathRain from '@/components/MathRain';
import { createClient } from '@/lib/supabase';

const EXAM_DATE_LABEL = '23 de junho';

const DIFFICULTY_TOPICS = [
  'Funções',
  'Geometria',
  'Trigonometria',
  'Contagem',
  'Sucessões',
  'Probabilidades',
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
    Contagem: '/cronogramas/cronograma_3m_prob_comb.pdf',
    Sucessões: '/cronogramas/cronograma_3m_sucessoes.pdf',
    Probabilidades: '/cronogramas/cronograma_3m_prob_comb.pdf',
    'Números complexos': '/cronogramas/cronograma_3m_complexos.pdf',
  },
  '2 meses antes': {
    Funções: '/cronogramas/cronograma_2m_funcoes.pdf',
    Geometria: '/cronogramas/cronograma_2m_geometria.pdf',
    Trigonometria: '/cronogramas/cronograma_2m_trigo.pdf',
    Contagem: '/cronogramas/cronograma_2m_prob_comb.pdf',
    Sucessões: '/cronogramas/cronograma_2m_sucessoes.pdf',
    Probabilidades: '/cronogramas/cronograma_2m_prob_comb.pdf',
    'Números complexos': '/cronogramas/cronograma_2m_complexos.pdf',
  },
  '1 mês antes': {
    Funções: '/cronogramas/cronograma_1m_funcoes.pdf',
    Geometria: '/cronogramas/cronograma_1m_geometria.pdf',
    Trigonometria: '/cronogramas/cronograma_1m_trigo.pdf',
    Contagem: '/cronogramas/cronograma_1m_prob_comb.pdf',
    Sucessões: '/cronogramas/cronograma_1m_sucessoes.pdf',
    Probabilidades: '/cronogramas/cronograma_1m_prob_comb.pdf',
    'Números complexos': '/cronogramas/cronograma_1m_complexos.pdf',
  },
  '2 semanas antes': {
    Funções: '/cronogramas/cronograma_2s_funcoes.pdf',
    Geometria: '/cronogramas/cronograma_2s_geometria.pdf',
    Trigonometria: '/cronogramas/cronograma_2s_trigo.pdf',
    Contagem: '/cronogramas/cronograma_2s_prob_comb.pdf',
    Sucessões: '/cronogramas/cronograma_2s_sucessoes.pdf',
    Probabilidades: '/cronogramas/cronograma_2s_prob_comb.pdf',
    'Números complexos': '/cronogramas/cronograma_2s_complexos.pdf',
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
  return PRESET_CRONOGRAMS[studyStart]?.[topic] || null;
}

export default function CronogramaPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [authChecked, setAuthChecked] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<DifficultyTopic | ''>('');
  const [selectedStudyStart, setSelectedStudyStart] = useState<StudyStartOption | ''>('');
  const [error, setError] = useState('');
  const [shownCronograma, setShownCronograma] = useState<CronogramaEntry | null>(null);
  const [selectionSummary, setSelectionSummary] = useState<string | null>(null);

  const isTwoWeeksSelected = selectedStudyStart === '2 semanas antes';

  const canGenerate = useMemo(() => {
    if (!selectedStudyStart) return false;
    return Boolean(selectedTopic);
  }, [selectedStudyStart, selectedTopic]);

  useEffect(() => {
    let cancelled = false;

    const checkAuth = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      let user = sessionData.session?.user ?? null;

      if (!user) {
        const { data: userData } = await supabase.auth.getUser();
        user = userData.user ?? null;
      }

      if (cancelled) return;

      if (!user) {
        router.replace('/login?next=/cronograma');
        return;
      }

      setAuthChecked(true);
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

    if (!selectedTopic) {
      setError('Seleciona o tema com mais dificuldade.');
      return;
    }

    const cronograma = getCronograma(selectedStudyStart, selectedTopic as DifficultyTopic);
    setShownCronograma(cronograma);
    setSelectionSummary(`${selectedTopic} · ${selectedStudyStart}`);

    if (!cronograma) {
      setError(
        'Não foi possível carregar o cronograma para esta combinação. Tenta novamente.',
      );
    }
  };

  return (
    <>
      <Navbar />
      <main className="pt-20 min-h-screen bg-[#f0f4f8]">
        <div className="relative bg-gradient-to-r from-[#0d2f4a] to-[#1a5276] py-12 px-4 overflow-hidden">
          <MathRain />
          <div className="relative z-10 max-w-4xl mx-auto text-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Cronograma</h1>
            <p className="text-white/70">
              Seleciona as tuas dificuldades e o momento de arranque para obter o cronograma certo.
            </p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-10 grid lg:grid-cols-[1.1fr_1fr] gap-6">
          {!authChecked ? (
            <section className="lg:col-span-2 bg-white rounded-2xl shadow-md p-8 text-center">
              <p className="text-sm text-gray-500">A verificar sessão...</p>
            </section>
          ) : (
            <>
          <section className="bg-white rounded-2xl shadow-md p-6">
            <h2 className="text-xl font-bold text-[#0d2f4a] mb-1">Criar cronograma</h2>
            <p className="text-sm text-gray-500 mb-5">
              O cronograma é escolhido com base nas tuas maiores dificuldades e na altura em que vais começar a estudar.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Data do exame</label>
                <div className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-[#f0f4f8] text-sm font-semibold text-[#0d2f4a]">
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
                  }}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-[#f0f4f8] text-sm focus:ring-2 focus:ring-[#3498db] focus:border-transparent outline-none"
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
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-[#f0f4f8] text-sm focus:ring-2 focus:ring-[#3498db] focus:border-transparent outline-none"
                >
                  <option value="">Seleciona o tema</option>
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
                className="w-full py-3.5 bg-gradient-to-r from-[#1a5276] to-[#2980b9] text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
            <h2 className="text-xl font-bold text-[#0d2f4a] mb-1">Cronograma</h2>
            <p className="text-sm text-gray-500 mb-5">
              {selectionSummary
                ? `Combinação selecionada: ${selectionSummary}`
                : 'O cronograma aparece aqui depois de selecionares as opções.'}
            </p>

            {!shownCronograma ? (
              <div className="rounded-xl border border-dashed border-gray-300 bg-[#f8fbff] p-6 text-sm text-gray-500 text-center">
                Seleciona o tema e a altura de início para consultar o cronograma.
              </div>
            ) : (
              <div className="space-y-3">
                <div className="rounded-xl bg-[#f8fbff] border border-[#3498db]/20 px-4 py-3">
                  <p className="text-sm font-bold text-[#0d2f4a]">{shownCronograma.title}</p>
                </div>

                {shownCronograma.filePath && (
                  <a
                    href={shownCronograma.filePath}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#1a5276] to-[#2980b9] text-white text-sm font-semibold hover:shadow-lg transition-all"
                  >
                    Abrir PDF
                  </a>
                )}

              </div>
            )}
          </section>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
