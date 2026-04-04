'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import {
  EXAM_HISTORY_YEARS,
  EXAM_THEME_GROUPS,
  SCHOOL_YEAR_OPTIONS,
  getExamOccurrenceBySelection,
  getOccurrencePercentage,
  getOccurrenceTone,
  type ExamTopicOccurrence,
  type SchoolYearOption,
} from '@/lib/exam-data';

function buildOccurrenceMatrix(entry: ExamTopicOccurrence) {
  return EXAM_HISTORY_YEARS.map((year) => ({
    year,
    firstPhase: entry.firstPhases.includes(year),
    secondPhase: entry.secondPhases.includes(year),
  }));
}

export default function ExamTopicExplorer() {
  const [schoolYear, setSchoolYear] = useState<SchoolYearOption | ''>('10º ano');
  const [broadTheme, setBroadTheme] = useState('Álgebra');
  const [subtheme, setSubtheme] = useState('Álgebra');
  const [selectedEntry, setSelectedEntry] = useState<ExamTopicOccurrence | null>(
    getExamOccurrenceBySelection('10º ano', 'Álgebra', 'Álgebra') ?? null,
  );
  const [message, setMessage] = useState('');

  const currentThemeGroups = useMemo(() => {
    if (!schoolYear) return [];
    return EXAM_THEME_GROUPS[schoolYear];
  }, [schoolYear]);

  const currentSubthemes = useMemo(() => {
    if (!schoolYear || !broadTheme) return [];
    return currentThemeGroups.find((group) => group.broadTheme === broadTheme)?.subthemes ?? [];
  }, [broadTheme, currentThemeGroups, schoolYear]);

  const occurrenceRows = useMemo(
    () => (selectedEntry ? buildOccurrenceMatrix(selectedEntry) : []),
    [selectedEntry],
  );

  const tone = selectedEntry ? getOccurrenceTone(selectedEntry.totalOccurrences) : null;
  const percentage = selectedEntry ? getOccurrencePercentage(selectedEntry.totalOccurrences) : 0;

  const handleSchoolYearChange = (value: SchoolYearOption | '') => {
    setSchoolYear(value);

    if (!value) {
      setBroadTheme('');
      setSubtheme('');
      return;
    }

    const firstGroup = EXAM_THEME_GROUPS[value][0];
    setBroadTheme(firstGroup?.broadTheme ?? '');
    setSubtheme(firstGroup?.subthemes[0] ?? '');
  };

  const handleBroadThemeChange = (value: string) => {
    setBroadTheme(value);
    const firstSubtheme = currentThemeGroups.find((group) => group.broadTheme === value)?.subthemes[0] ?? '';
    setSubtheme(firstSubtheme);
  };

  const handleSearch = () => {
    if (!schoolYear || !broadTheme || !subtheme) {
      setMessage('Seleciona o ano, o tema geral e o tema específico.');
      return;
    }

    const foundBySelection = getExamOccurrenceBySelection(schoolYear, broadTheme, subtheme);
    if (!foundBySelection) {
      setSelectedEntry(null);
      setMessage('Não encontrámos resultados para esta combinação.');
      return;
    }

    setSelectedEntry(foundBySelection);
    setMessage('');
  };

  return (
    <div className="grid xl:grid-cols-[0.92fr_1.08fr] gap-6 items-start">
      <section className="rounded-[2rem] border border-black/10 bg-white p-6 sm:p-8 shadow-[0_24px_60px_rgba(0,0,0,0.08)]">
        <div className="mb-6">
          <h2 className="text-2xl font-black text-[#111111] mb-2">Descobre em que exames saiu cada tema</h2>
          <p className="text-sm leading-relaxed text-gray-600">
            Seleciona o ano, o tema geral e o subtema. O resultado mostra em que exames essa matéria apareceu.
          </p>
        </div>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Ano escolar</label>
              <select
                value={schoolYear}
                onChange={(event) => handleSchoolYearChange(event.target.value as SchoolYearOption | '')}
                className="w-full rounded-2xl border border-black/10 bg-[#f7f9fc] px-4 py-3 text-sm text-[#111111] outline-none transition-all focus:border-[#3f6c93] focus:ring-2 focus:ring-[#3f6c93]/20"
              >
                <option value="">Seleciona o ano</option>
                {SCHOOL_YEAR_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Tema abrangente</label>
              <select
                value={broadTheme}
                onChange={(event) => handleBroadThemeChange(event.target.value)}
                disabled={!schoolYear}
                className="w-full rounded-2xl border border-black/10 bg-[#f7f9fc] px-4 py-3 text-sm text-[#111111] outline-none transition-all focus:border-[#3f6c93] focus:ring-2 focus:ring-[#3f6c93]/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="">Seleciona o tema geral</option>
                {currentThemeGroups.map((group) => (
                  <option key={group.broadTheme} value={group.broadTheme}>
                    {group.broadTheme}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Tema específico</label>
              <select
                value={subtheme}
                onChange={(event) => setSubtheme(event.target.value)}
                disabled={!broadTheme}
                className="w-full rounded-2xl border border-black/10 bg-[#f7f9fc] px-4 py-3 text-sm text-[#111111] outline-none transition-all focus:border-[#3f6c93] focus:ring-2 focus:ring-[#3f6c93]/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="">Seleciona o subtema</option>
                {currentSubthemes.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSearch}
            className="w-full rounded-2xl bg-[#111111] px-5 py-3.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-[0_20px_45px_rgba(17,17,17,0.18)]"
          >
            Ver frequência
          </button>

          {message && (
            <div className="rounded-2xl border border-[#3f6c93]/20 bg-[#edf4fb] px-4 py-3 text-sm text-[#294a67]">
              {message}
            </div>
          )}
        </div>
      </section>

      <section className="rounded-[2rem] border border-black/10 bg-white p-6 sm:p-8 shadow-[0_24px_60px_rgba(0,0,0,0.08)]">
        {!selectedEntry ? (
          <div className="rounded-[1.75rem] border border-dashed border-black/15 bg-[#fafafa] px-6 py-8 text-center text-sm text-gray-500">
            O quadro com a frequência do tema aparece aqui depois de fazeres a pesquisa.
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_240px] md:items-start mb-6">
              <div className="min-w-0">
                <h2 className="text-2xl font-black text-[#111111] mb-2">{selectedEntry.subtheme}</h2>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><span className="font-semibold text-[#111111]">Ano:</span> {selectedEntry.schoolYear}</p>
                  <p><span className="font-semibold text-[#111111]">Tema:</span> {selectedEntry.broadTheme}</p>
                </div>
              </div>

              {tone && (
                <div className="rounded-[1.5rem] border border-black/10 bg-[#fafafa] px-4 py-3 self-start">
                  <div className="flex items-center gap-3 mb-2">
                    <Image
                      src={tone.iconSrc}
                      alt=""
                      width={20}
                      height={20}
                      className="h-5 w-5 object-contain"
                    />
                    <p className="text-sm font-semibold text-[#111111]">{tone.label}</p>
                  </div>
                  <p className="text-sm text-gray-600">
                    Apareceu em <span className="font-bold text-[#111111]">{selectedEntry.totalOccurrences}</span> de 20 exames ({percentage}%).
                  </p>
                </div>
              )}
            </div>

            <div className="overflow-hidden rounded-[1.75rem] border border-black/10 bg-white">
              <div className="grid grid-cols-[0.8fr_0.6fr_0.6fr] gap-px bg-black/5 text-sm font-semibold text-[#111111]">
                <div className="bg-[#f7f9fc] px-4 py-3">Ano</div>
                <div className="bg-[#f7f9fc] px-4 py-3">1.ª fase</div>
                <div className="bg-[#f7f9fc] px-4 py-3">2.ª fase</div>
              </div>

              <div className="divide-y divide-black/10">
                {occurrenceRows.map((row) => (
                  <div key={row.year} className="grid grid-cols-[0.8fr_0.6fr_0.6fr] text-sm">
                    <div className="px-4 py-3 text-[#111111]">{row.year}</div>
                    <div className="px-4 py-3 text-center text-lg text-[#111111]">{row.firstPhase ? '✓' : '–'}</div>
                    <div className="px-4 py-3 text-center text-lg text-[#111111]">{row.secondPhase ? '✓' : '–'}</div>
                  </div>
                ))}
              </div>
            </div>

            <p className="mt-4 text-sm text-gray-600">✓ = Saiu no exame · – = Não saiu</p>
          </>
        )}
      </section>
    </div>
  );
}
