'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import {
  EXAM_HISTORY_YEARS,
  EXAM_THEME_GROUPS,
  getExamOccurrenceBySelection,
  getOccurrencePercentage,
  getOccurrenceTone,
  SCHOOL_YEAR_OPTIONS,
  type SchoolYearOption,
} from '@/lib/exam-data';

type SelectedEntry = {
  schoolYear: SchoolYearOption;
  broadTheme: string;
  subtheme: string;
};

function buildPhaseSet(years: number[]) {
  return new Set(years);
}

export default function ExamTopicExplorer() {
  const defaultYear = SCHOOL_YEAR_OPTIONS[0];
  const defaultBroadTheme = EXAM_THEME_GROUPS[defaultYear][0]?.broadTheme ?? '';
  const defaultSubtheme = EXAM_THEME_GROUPS[defaultYear][0]?.subthemes[0] ?? '';

  const [schoolYear, setSchoolYear] = useState<SchoolYearOption>(defaultYear);
  const [broadTheme, setBroadTheme] = useState(defaultBroadTheme);
  const [subtheme, setSubtheme] = useState(defaultSubtheme);
  const [selectedEntry, setSelectedEntry] = useState<SelectedEntry>({
    schoolYear: defaultYear,
    broadTheme: defaultBroadTheme,
    subtheme: defaultSubtheme,
  });
  const [message, setMessage] = useState('');

  const currentThemeGroups = EXAM_THEME_GROUPS[schoolYear] ?? [];
  const currentSubthemes =
    currentThemeGroups.find((group) => group.broadTheme === broadTheme)?.subthemes ?? [];

  useEffect(() => {
    const nextBroadTheme = EXAM_THEME_GROUPS[schoolYear][0]?.broadTheme ?? '';
    const nextSubtheme = EXAM_THEME_GROUPS[schoolYear][0]?.subthemes[0] ?? '';

    setBroadTheme(nextBroadTheme);
    setSubtheme(nextSubtheme);
  }, [schoolYear]);

  useEffect(() => {
    const nextSubtheme = currentSubthemes[0] ?? '';
    setSubtheme(nextSubtheme);
  }, [broadTheme, currentSubthemes]);

  const occurrence = useMemo(
    () =>
      getExamOccurrenceBySelection(
        selectedEntry.schoolYear,
        selectedEntry.broadTheme,
        selectedEntry.subtheme,
      ) ?? null,
    [selectedEntry],
  );

  const tone = occurrence ? getOccurrenceTone(occurrence.totalOccurrences) : null;
  const percentage = occurrence ? getOccurrencePercentage(occurrence.totalOccurrences) : 0;
  const firstPhaseSet = occurrence ? buildPhaseSet(occurrence.firstPhases) : new Set<number>();
  const secondPhaseSet = occurrence ? buildPhaseSet(occurrence.secondPhases) : new Set<number>();

  const handleSearch = () => {
    if (!schoolYear || !broadTheme || !subtheme) {
      setMessage('Seleciona o ano, o tema geral e o subtema.');
      return;
    }

    setSelectedEntry({ schoolYear, broadTheme, subtheme });
    setMessage('');
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr] items-start">
      <section className="rounded-[2rem] border border-black/10 bg-white p-6 sm:p-8 shadow-[0_24px_60px_rgba(0,0,0,0.08)]">
        <div className="mb-6">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.32em] text-[#5b7da3]">
            Pesquisa por tema
          </p>
          <h2 className="mb-3 text-2xl font-black text-[#111111]">Descobre em que exames saiu cada tema</h2>
          <p className="text-sm leading-relaxed text-gray-600">
            Seleciona o ano, o tema geral e o subtema. O resultado mostra em que exames essa matéria apareceu.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Ano escolar</label>
            <select
              value={schoolYear}
              onChange={(event) => setSchoolYear(event.target.value as SchoolYearOption)}
              className="w-full rounded-2xl border border-black/10 bg-[#f7f9fc] px-4 py-3 text-sm text-[#111111] outline-none transition-all focus:border-[#3f6c93] focus:ring-2 focus:ring-[#3f6c93]/20"
            >
              {SCHOOL_YEAR_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Tema abrangente</label>
              <select
                value={broadTheme}
                onChange={(event) => setBroadTheme(event.target.value)}
                className="w-full rounded-2xl border border-black/10 bg-[#f7f9fc] px-4 py-3 text-sm text-[#111111] outline-none transition-all focus:border-[#3f6c93] focus:ring-2 focus:ring-[#3f6c93]/20"
              >
                {currentThemeGroups.map((group) => (
                  <option key={group.broadTheme} value={group.broadTheme}>
                    {group.broadTheme}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Tema específico</label>
              <select
                value={subtheme}
                onChange={(event) => setSubtheme(event.target.value)}
                className="w-full rounded-2xl border border-black/10 bg-[#f7f9fc] px-4 py-3 text-sm text-[#111111] outline-none transition-all focus:border-[#3f6c93] focus:ring-2 focus:ring-[#3f6c93]/20"
              >
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
        {!occurrence || !tone ? (
          <div className="rounded-[1.75rem] border border-dashed border-black/15 bg-[#fafafa] px-6 py-8 text-center text-sm text-gray-500">
            O resultado aparece aqui depois de selecionares o tema.
          </div>
        ) : (
          <>
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <p className="mb-2 text-sm font-bold uppercase tracking-[0.32em] text-[#5b7da3]">Resultado</p>
                <h2 className="mb-2 text-2xl font-black text-[#111111]">{occurrence.broadTheme}</h2>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>
                    <span className="font-semibold text-[#111111]">Ano:</span> {occurrence.schoolYear}
                  </p>
                  <p>
                    <span className="font-semibold text-[#111111]">Tema:</span> {occurrence.subtheme}
                  </p>
                </div>
              </div>

              <div className="flex min-h-[92px] min-w-[230px] items-center rounded-[1.5rem] border border-black/10 bg-[#fafafa] px-4 py-3">
                <div className="flex items-center gap-3">
                  <Image
                    src={tone.iconSrc}
                    alt={tone.label}
                    width={28}
                    height={28}
                    className="h-7 w-7 object-contain"
                  />
                  <div>
                    <p className="font-semibold text-[#111111]">{tone.label}</p>
                    <p className="text-sm text-gray-600">
                      Apareceu em {occurrence.totalOccurrences} de 20 exames ({percentage}%).
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-[1.5rem] border border-black/10">
              <table className="w-full border-collapse text-left">
                <thead className="bg-[#fafafa] text-sm text-[#111111]">
                  <tr>
                    <th className="border-b border-black/10 px-4 py-3 font-semibold">Ano</th>
                    <th className="border-b border-l border-black/10 px-4 py-3 text-center font-semibold">1.ª fase</th>
                    <th className="border-b border-l border-black/10 px-4 py-3 text-center font-semibold">2.ª fase</th>
                  </tr>
                </thead>
                <tbody>
                  {EXAM_HISTORY_YEARS.map((year) => (
                    <tr key={year} className="border-b border-black/10 last:border-b-0">
                      <td className="px-4 py-3 text-sm font-medium text-[#111111]">{year}</td>
                      <td className="border-l border-black/10 px-4 py-3 text-center text-lg text-[#111111]">
                        {firstPhaseSet.has(year) ? '✓' : '−'}
                      </td>
                      <td className="border-l border-black/10 px-4 py-3 text-center text-lg text-[#111111]">
                        {secondPhaseSet.has(year) ? '✓' : '−'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="mt-4 text-sm text-gray-600">✓ = Saiu no exame · − = Não saiu</p>

            {occurrence.schoolYear === '11º ano' &&
              occurrence.broadTheme === 'Estatística' &&
              occurrence.subtheme === 'Estatística' && (
                <div className="mt-4 rounded-[1.5rem] border border-[#3f6c93]/15 bg-[#edf4fb] px-4 py-3 text-sm text-[#294a67]">
                  A tendência é que Estatística volte a sair nos próximos exames.
                </div>
              )}
          </>
        )}
      </section>
    </div>
  );
}
