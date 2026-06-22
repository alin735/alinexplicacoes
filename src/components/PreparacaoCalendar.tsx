'use client';

import { useMemo, useState } from 'react';
import { GROUP_CLASS_LESSONS, type GroupClassLesson } from '@/lib/group-classes';

const MONTHS_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const DAYS_PT = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const EXAM_DATE = '2026-06-22';
const MIN_MONTH_KEY = '2026-05';
const MAX_MONTH_KEY = '2026-06';

type Props = {
  mode?: 'view' | 'select';
  maxSelections?: number;
  selected?: Set<string>;
  onToggle?: (lesson: GroupClassLesson) => void;
  lockedLessonIds?: Set<number>;
};

export default function PreparacaoCalendar({
  mode = 'view',
  maxSelections = 0,
  selected = new Set(),
  onToggle,
  lockedLessonIds = new Set(),
}: Props) {
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 4, 1));
  const [focusedDate, setFocusedDate] = useState<string | null>(null);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
  const canGoPrev = monthKey > MIN_MONTH_KEY;
  const canGoNext = monthKey < MAX_MONTH_KEY;

  const firstDayJs = new Date(year, month, 1).getDay();
  const offset = firstDayJs === 0 ? 6 : firstDayJs - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const lessonsByDate = useMemo(() => {
    const map = new Map<string, GroupClassLesson>();
    GROUP_CLASS_LESSONS.forEach((l) => map.set(l.date, l));
    return map;
  }, []);

  const cells: (number | null)[] = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let i = 1; i <= daysInMonth; i++) cells.push(i);

  const pad = (n: number) => String(n).padStart(2, '0');
  const toDateStr = (day: number) => `${year}-${pad(month + 1)}-${pad(day)}`;

  const activeFocusedLesson = focusedDate ? lessonsByDate.get(focusedDate) ?? null : null;

  const handleCellClick = (day: number) => {
    const dateStr = toDateStr(day);
    const lesson = lessonsByDate.get(dateStr);

    if (mode === 'view') {
      setFocusedDate((prev) => (prev === dateStr ? null : dateStr));
      return;
    }

    if (!lesson) return;
    if (lockedLessonIds.has(lesson.id)) return;
    if (!selected.has(dateStr) && selected.size >= maxSelections) return;
    onToggle?.(lesson);
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}
          disabled={!canGoPrev}
          className="w-9 h-9 rounded-full border border-black/10 bg-white flex items-center justify-center text-[#111111] hover:bg-[#f5f5f5] disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
          aria-label="Mês anterior"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h3 className="text-lg font-black text-[#000000]">
          {MONTHS_PT[month]} {year}
        </h3>
        <button
          onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}
          disabled={!canGoNext}
          className="w-9 h-9 rounded-full border border-black/10 bg-white flex items-center justify-center text-[#111111] hover:bg-[#f5f5f5] disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
          aria-label="Mês seguinte"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 mb-2">
        {DAYS_PT.map((d) => (
          <div key={d} className="text-center text-[10px] font-black text-gray-400 uppercase tracking-wider py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} />;

          const dateStr = toDateStr(day);
          const lesson = lessonsByDate.get(dateStr);
          const isExam = dateStr === EXAM_DATE;
          const isFocused = focusedDate === dateStr;
          const isSelected = selected.has(dateStr);
          const isLocked = !!lesson && lockedLessonIds.has(lesson.id);
          const isSelectable = mode === 'select' && !!lesson && !isLocked && (isSelected || selected.size < maxSelections);

          // Base styles
          let cellClass = 'relative flex flex-col items-center justify-center rounded-xl text-center transition-all ';

          if (isExam) {
            cellClass += 'h-14 bg-red-500 text-white cursor-default shadow-lg';
          } else if (lesson) {
            if (isLocked) {
              cellClass += 'h-14 bg-[#e8e8e8] text-gray-500 cursor-not-allowed ';
            } else if (isSelected) {
              cellClass += 'h-14 bg-[#000000] text-white shadow-md ';
            } else if (isFocused && mode === 'view') {
              cellClass += 'h-14 bg-[#111111] text-white shadow-md ';
            } else {
              cellClass += 'h-14 bg-[#111111] text-white cursor-pointer hover:bg-[#000000] hover:shadow-md ';
              if (!isSelectable && mode === 'select') {
                cellClass += 'opacity-40 cursor-not-allowed ';
              }
            }
          } else {
            cellClass += 'h-14 text-gray-300 cursor-default ';
          }

          return (
            <button
              key={dateStr}
              onClick={() => handleCellClick(day)}
              disabled={(!lesson && !isExam) || isLocked}
              className={cellClass}
              aria-label={lesson ? `Aula ${lesson.id}, ${dateStr}${isLocked ? ' (já comprada)' : ''}` : isExam ? 'Dia do Exame' : undefined}
              title={isLocked ? 'Já compraste esta aula' : undefined}
            >
              {isExam ? (
                <>
                  <span className="text-[9px] font-black uppercase tracking-wider leading-none mb-0.5">Exame</span>
                  <span className="text-lg font-black leading-none">{day}</span>
                </>
              ) : lesson ? (
                <>
                  <span className="text-[9px] font-black leading-none mb-0.5 opacity-70">
                    A{lesson.id}
                  </span>
                  <span className="text-base font-black leading-none">{day}</span>
                  <span className="text-[9px] font-medium leading-none mt-0.5 opacity-70">{lesson.time}</span>
                  {isSelected && !isLocked && (
                    <span className="absolute top-1 right-1">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                  )}
                  {isLocked && (
                    <span className="absolute top-1 right-1">
                      <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 11V7a5 5 0 0110 0v4M5 11h10v8H5v-8z" />
                      </svg>
                    </span>
                  )}
                </>
              ) : (
                <span className="text-sm font-medium">{day}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm bg-[#111111]" />
          Aula
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm bg-red-500" />
          Exame
        </span>
        {mode === 'select' && (
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-sm bg-[#000000]" />
            Selecionada
          </span>
        )}
        {mode === 'select' && lockedLessonIds.size > 0 && (
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-sm bg-[#e8e8e8] border border-gray-300" />
            Já comprada
          </span>
        )}
      </div>

      {/* Detail panel (view mode only) */}
      {mode === 'view' && (
        <div
          className={`mt-4 rounded-2xl border border-black/10 bg-white p-4 transition-all duration-300 ${
            activeFocusedLesson ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          {activeFocusedLesson && (
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#111111] flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-black">A{activeFocusedLesson.id}</span>
              </div>
              <div>
                <p className="text-xs font-black text-[#5a7ca8] uppercase tracking-wider mb-0.5">
                  Aula {activeFocusedLesson.id} · {activeFocusedLesson.time}
                </p>
                <p className="font-black text-[#000000]">{activeFocusedLesson.topic}</p>
                <p className="text-xs text-gray-400 mt-0.5">{activeFocusedLesson.date.split('-').reverse().join('/')}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
