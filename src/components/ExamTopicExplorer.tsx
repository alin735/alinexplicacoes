'use client';

import { useMemo, useState } from 'react';
import { MATH_TOPICS_BY_YEAR, SCHOOL_YEARS, type SchoolYear } from '@/lib/types';

export default function ExamTopicExplorer() {
  const formatYearLabel = (year: SchoolYear) => (year === '7º-9º' ? '7º-9º anos' : `${year} ano`);
  const defaultYear = SCHOOL_YEARS[0];
  const defaultTopic = MATH_TOPICS_BY_YEAR[defaultYear][0] ?? '';
  const [schoolYear, setSchoolYear] = useState<SchoolYear | ''>(defaultYear);
  const [topic, setTopic] = useState(defaultTopic);
  const [selectedEntry, setSelectedEntry] = useState<{ schoolYear: SchoolYear; topic: string } | null>({
    schoolYear: defaultYear,
    topic: defaultTopic,
  });
  const [message, setMessage] = useState('');

  const currentTopics = useMemo(
    () => (schoolYear ? MATH_TOPICS_BY_YEAR[schoolYear] : []),
    [schoolYear],
  );

  const handleSchoolYearChange = (value: SchoolYear | '') => {
    setSchoolYear(value);

    if (!value) {
      setTopic('');
      return;
    }

    setTopic(MATH_TOPICS_BY_YEAR[value][0] ?? '');
  };

  const handleSearch = () => {
    if (!schoolYear || !topic) {
      setMessage('Seleciona o ano e o tema.');
      return;
    }

    setSelectedEntry({ schoolYear, topic });
    setMessage('');
  };

  return (
    <div className="grid xl:grid-cols-[0.92fr_1.08fr] gap-6 items-start">
      <section className="rounded-[2rem] border border-black/10 bg-white p-6 sm:p-8 shadow-[0_24px_60px_rgba(0,0,0,0.08)]">
        <div className="mb-6">
          <h2 className="text-2xl font-black text-[#111111] mb-2">Temas das explicações</h2>
          <p className="text-sm leading-relaxed text-gray-600">
            Seleciona o ano escolar e o tema que queres trabalhar nas explicações.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Ano escolar</label>
            <select
              value={schoolYear}
              onChange={(event) => handleSchoolYearChange(event.target.value as SchoolYear | '')}
              className="w-full rounded-2xl border border-black/10 bg-[#f7f9fc] px-4 py-3 text-sm text-[#111111] outline-none transition-all focus:border-[#3f6c93] focus:ring-2 focus:ring-[#3f6c93]/20"
            >
              <option value="">Seleciona o ano</option>
              {SCHOOL_YEARS.map((option) => (
                <option key={option} value={option}>
                  {formatYearLabel(option)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tema</label>
            <select
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              disabled={!schoolYear}
              className="w-full rounded-2xl border border-black/10 bg-[#f7f9fc] px-4 py-3 text-sm text-[#111111] outline-none transition-all focus:border-[#3f6c93] focus:ring-2 focus:ring-[#3f6c93]/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="">{schoolYear ? 'Seleciona o tema' : 'Seleciona primeiro o ano'}</option>
              {currentTopics.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleSearch}
            className="w-full rounded-2xl bg-[#111111] px-5 py-3.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-[0_20px_45px_rgba(17,17,17,0.18)]"
          >
            Confirmar tema
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
            A informação do tema aparece aqui depois de confirmares a seleção.
          </div>
        ) : (
          <>
            <div className="mb-6">
              <div className="min-w-0">
                <h2 className="text-2xl font-black text-[#111111] mb-2">{selectedEntry.topic}</h2>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><span className="font-semibold text-[#111111]">Ano:</span> {formatYearLabel(selectedEntry.schoolYear)}</p>
                  <p><span className="font-semibold text-[#111111]">Tema:</span> {selectedEntry.topic}</p>
                </div>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-black/10 bg-[#fafafa] p-4">
              <p className="text-sm text-[#111111] font-semibold mb-3">Temas disponíveis neste ano:</p>
              <div className="flex flex-wrap gap-2">
                {(schoolYear ? MATH_TOPICS_BY_YEAR[schoolYear] : []).map((item) => (
                  <span
                    key={item}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                      item === selectedEntry.topic
                        ? 'border-[#111111] bg-[#111111] text-white'
                        : 'border-black/10 bg-white text-[#111111]'
                    }`}
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
