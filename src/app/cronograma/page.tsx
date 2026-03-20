'use client';

import { useMemo, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MathRain from '@/components/MathRain';

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
  steps: string[];
  notes?: string;
  filePath?: string;
  extraFiles?: { label: string; path: string }[];
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
            steps: [
              'Lê o cronograma completo e identifica o foco de cada semana.',
              'Segue as tarefas pela ordem proposta e marca o progresso no final de cada sessão.',
              'Usa as explicações para desbloquear os pontos em que travares.',
            ],
            notes: 'Podes descarregar o cronograma em PDF e usar como guia principal de estudo.',
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

function getTwoWeeksIntensiveCronograma(): CronogramaEntry {
  const options = CRONOGRAMA_FILE_MAP['2 semanas antes'];
  return {
    title: 'Cronograma intensivo · 2 semanas antes',
    steps: [
      'Neste modo intensivo, começa por rever a estrutura geral do exame e os tópicos com mais impacto.',
      'Escolhe o PDF mais alinhado com a tua maior prioridade desta semana e executa-o até ao fim.',
      'No final de cada dia, regista os erros e ajusta o dia seguinte para atacar as falhas repetidas.',
    ],
    notes: 'Para 2 semanas antes, o foco é execução intensiva e revisão estratégica.',
    extraFiles: [
      { label: 'Funções', path: options['Funções'] },
      { label: 'Geometria', path: options['Geometria'] },
      { label: 'Trigonometria', path: options['Trigonometria'] },
      { label: 'Contagem', path: options['Contagem'] },
      { label: 'Sucessões', path: options['Sucessões'] },
      { label: 'Probabilidades', path: options['Probabilidades'] },
      { label: 'Números complexos', path: options['Números complexos'] },
    ],
  };
}

export default function CronogramaPage() {
  const [selectedTopic, setSelectedTopic] = useState<DifficultyTopic | ''>('');
  const [selectedStudyStart, setSelectedStudyStart] = useState<StudyStartOption | ''>('');
  const [error, setError] = useState('');
  const [shownCronograma, setShownCronograma] = useState<CronogramaEntry | null>(null);
  const [selectionSummary, setSelectionSummary] = useState<string | null>(null);

  const isTwoWeeksSelected = selectedStudyStart === '2 semanas antes';
  const isTopicSelectionLocked = isTwoWeeksSelected;

  const canGenerate = useMemo(() => {
    if (!selectedStudyStart) return false;
    if (isTwoWeeksSelected) return true;
    return Boolean(selectedTopic);
  }, [isTwoWeeksSelected, selectedStudyStart, selectedTopic]);

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

    const cronograma = isTwoWeeksSelected
      ? getTwoWeeksIntensiveCronograma()
      : getCronograma(selectedStudyStart, selectedTopic as DifficultyTopic);
    setShownCronograma(cronograma);
    setSelectionSummary(
      isTwoWeeksSelected
        ? `Plano intensivo · ${selectedStudyStart}`
        : `${selectedTopic} · ${selectedStudyStart}`,
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
                    if (value === '2 semanas antes') {
                      setSelectedTopic('');
                    }
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
                  disabled={isTopicSelectionLocked}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-[#f0f4f8] text-sm focus:ring-2 focus:ring-[#3498db] focus:border-transparent outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <option value="">{isTopicSelectionLocked ? 'Bloqueado para 2 semanas antes' : 'Seleciona o tema'}</option>
                  {DIFFICULTY_TOPICS.map((topic) => (
                    <option key={topic} value={topic}>
                      {topic}
                    </option>
                  ))}
                </select>
                {isTopicSelectionLocked && (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2">
                    Para o modo "2 semanas antes", o cronograma é intensivo e não permite escolher tema específico.
                  </p>
                )}
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
                    Abrir cronograma em PDF
                  </a>
                )}

                {shownCronograma.extraFiles && shownCronograma.extraFiles.length > 0 && (
                  <div className="grid sm:grid-cols-2 gap-2">
                    {shownCronograma.extraFiles.map((file) => (
                      <a
                        key={file.path}
                        href={file.path}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center px-3 py-2 rounded-lg border border-[#3498db]/30 bg-[#f8fbff] text-[#1a5276] text-sm font-medium hover:bg-[#e8f3ff] transition-colors"
                      >
                        Abrir PDF · {file.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
