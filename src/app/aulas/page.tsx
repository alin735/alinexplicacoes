'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { createClient } from '@/lib/supabase';
import { SUBJECTS } from '@/lib/types';
import type { Lesson, LessonAttachment } from '@/lib/types';
import MathRain from '@/components/MathRain';

const SUBJECT_EMOJIS: Record<string, string> = {
  'Matemática': '📐',
  'Físico-Química': '⚗️',
  'Biologia-Geologia': '🧬',
  'Português': '📖',
};

const SUBJECT_COLORS: Record<string, string> = {
  'Matemática': 'from-blue-400 to-blue-600',
  'Físico-Química': 'from-purple-400 to-purple-600',
  'Biologia-Geologia': 'from-green-400 to-green-600',
  'Português': 'from-amber-400 to-amber-600',
};

const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'];

function isImageFile(fileName: string) {
  return IMAGE_EXTENSIONS.some((ext) => fileName.toLowerCase().endsWith(ext));
}

/* ───── Lightbox with zoom ───── */
function ImageLightbox({
  src,
  alt,
  onClose,
}: {
  src: string;
  alt: string;
  onClose: () => void;
}) {
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.stopPropagation();
      const delta = e.deltaY > 0 ? -0.15 : 0.15;
      setScale((s) => Math.min(Math.max(s + delta, 0.5), 5));
    },
    [],
  );

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (scale <= 1) return;
    e.preventDefault();
    setDragging(true);
    lastPos.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [scale]);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastPos.current.x;
      const dy = e.clientY - lastPos.current.y;
      lastPos.current = { x: e.clientX, y: e.clientY };
      setTranslate((t) => ({ x: t.x + dx, y: t.y + dy }));
    },
    [dragging],
  );

  const handlePointerUp = useCallback(() => setDragging(false), []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Reset position when scale resets
  useEffect(() => {
    if (scale <= 1) setTranslate({ x: 0, y: 0 });
  }, [scale]);

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Zoom controls */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-3 py-1.5">
        <button
          onClick={() => setScale((s) => Math.max(s - 0.25, 0.5))}
          className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center text-white text-lg transition-colors"
        >
          −
        </button>
        <span className="text-white text-xs font-medium min-w-[3rem] text-center">
          {Math.round(scale * 100)}%
        </span>
        <button
          onClick={() => setScale((s) => Math.min(s + 0.25, 5))}
          className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center text-white text-lg transition-colors"
        >
          +
        </button>
        {scale !== 1 && (
          <button
            onClick={() => { setScale(1); setTranslate({ x: 0, y: 0 }); }}
            className="ml-1 px-2 h-8 rounded-full hover:bg-white/20 flex items-center justify-center text-white text-xs transition-colors"
          >
            Reset
          </button>
        )}
      </div>

      {/* Image container */}
      <div
        ref={containerRef}
        className="w-full h-full flex items-center justify-center overflow-hidden p-4 sm:p-8"
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{ cursor: scale > 1 ? (dragging ? 'grabbing' : 'grab') : 'default', touchAction: 'none' }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className="max-w-full max-h-[90vh] object-contain rounded-lg select-none"
          style={{
            transform: `scale(${scale}) translate(${translate.x / scale}px, ${translate.y / scale}px)`,
            transition: dragging ? 'none' : 'transform 0.2s ease',
          }}
          draggable={false}
        />
      </div>
    </div>
  );
}

export default function AulasPage() {
  const [user, setUser] = useState<any>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedLesson, setExpandedLesson] = useState<string | null>(null);
  // Filters
  const [filterDate, setFilterDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [filterSubject, setFilterSubject] = useState('');
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);
  // Lightbox
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [lightboxAlt, setLightboxAlt] = useState('');

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);
      fetchLessons(user.id);
    };
    checkAuth();
  }, []);

  const fetchLessons = async (userId: string) => {
    const { data, error } = await supabase
      .from('lessons')
      .select('*, lesson_attachments(*)')
      .eq('student_id', userId)
      .order('date', { ascending: false });

    if (!error) {
      setLessons(data || []);
    }
    setLoading(false);
  };

  const filteredLessons = lessons.filter((lesson) => {
    if (filterDate && lesson.date !== filterDate) return false;
    if (filterSubject && lesson.subject !== filterSubject) return false;
    return true;
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-PT', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0f4f8]">
        <div className="animate-spin w-8 h-8 border-4 border-[#3498db] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <main className="pt-20 min-h-screen bg-[#f0f4f8]">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-[#0d2f4a] to-[#1a5276] py-12 px-4 overflow-hidden">
          <MathRain />
          <div className="relative z-10 max-w-4xl mx-auto text-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
              Minhas aulas
            </h1>
            <p className="text-white/60">
              Todas as tuas explicações com o Alin.
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-10">
          {lessons.length === 0 ? (
            /* Empty state */
            <div className="text-center py-20 animate-fade-in-up">
              <div className="w-24 h-24 mx-auto mb-6 bg-[#3498db]/10 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-[#3498db]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-[#0d2f4a] mb-3">
                Ainda não tiveste nenhuma explicação com o Alin
              </h2>
              <p className="text-gray-500 mb-8 max-w-md mx-auto">
                Marca a tua primeira explicação e começa já a aprender!
              </p>
              <Link
                href="/marcar"
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#1a5276] to-[#2980b9] text-white font-bold rounded-2xl text-lg hover:shadow-xl hover:shadow-[#3498db]/30 hover:-translate-y-1 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Marcar explicação
              </Link>
            </div>
          ) : (
            <>
              {/* Filter controls */}
              <div className="flex flex-wrap items-start gap-3 mb-6">
                <p className="text-sm text-gray-500 mr-auto self-center">
                  <strong className="text-[#0d2f4a]">{filteredLessons.length}</strong>{' '}
                  {filteredLessons.length === 1 ? 'aula' : 'aulas'}
                </p>

                {/* Date filter */}
                <div className="relative">
                  <button
                    onClick={() => { setShowDatePicker(!showDatePicker); setShowSubjectPicker(false); }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                      filterDate
                        ? 'bg-gradient-to-r from-[#3498db] to-[#5dade2] text-white shadow-sm'
                        : 'bg-white text-gray-500 hover:text-gray-700 shadow-sm'
                    }`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Data
                    {filterDate && (
                      <span
                        onClick={(e) => { e.stopPropagation(); setFilterDate(''); setShowDatePicker(false); }}
                        className="ml-1 w-4 h-4 rounded-full bg-white/30 flex items-center justify-center text-[10px] hover:bg-white/50 cursor-pointer"
                      >
                        ✕
                      </span>
                    )}
                  </button>
                  {showDatePicker && (
                    <div className="absolute top-full mt-2 right-0 bg-white rounded-xl shadow-xl border border-gray-100 p-3 z-20 animate-fade-in-up">
                      <input
                        type="date"
                        value={filterDate}
                        onChange={(e) => { setFilterDate(e.target.value); setShowDatePicker(false); }}
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#3498db] focus:border-transparent outline-none"
                      />
                      {filterDate && (
                        <button
                          onClick={() => { setFilterDate(''); setShowDatePicker(false); }}
                          className="mt-2 w-full text-xs text-red-500 hover:text-red-700 transition-colors"
                        >
                          Limpar data
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Subject filter */}
                <div className="relative">
                  <button
                    onClick={() => { setShowSubjectPicker(!showSubjectPicker); setShowDatePicker(false); }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                      filterSubject
                        ? 'bg-gradient-to-r from-[#3498db] to-[#5dade2] text-white shadow-sm'
                        : 'bg-white text-gray-500 hover:text-gray-700 shadow-sm'
                    }`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    Disciplina
                    {filterSubject && (
                      <span
                        onClick={(e) => { e.stopPropagation(); setFilterSubject(''); setShowSubjectPicker(false); }}
                        className="ml-1 w-4 h-4 rounded-full bg-white/30 flex items-center justify-center text-[10px] hover:bg-white/50 cursor-pointer"
                      >
                        ✕
                      </span>
                    )}
                  </button>
                  {showSubjectPicker && (
                    <div className="absolute top-full mt-2 right-0 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-20 min-w-[180px] animate-fade-in-up">
                      {SUBJECTS.map((s) => (
                        <button
                          key={s}
                          onClick={() => { setFilterSubject(s); setShowSubjectPicker(false); }}
                          className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                            filterSubject === s
                              ? 'bg-[#3498db]/10 text-[#3498db] font-medium'
                              : 'text-gray-700 hover:bg-[#f0f4f8]'
                          }`}
                        >
                          {SUBJECT_EMOJIS[s] || '📚'} {s}
                        </button>
                      ))}
                      {filterSubject && (
                        <button
                          onClick={() => { setFilterSubject(''); setShowSubjectPicker(false); }}
                          className="w-full text-left px-4 py-2 text-xs text-red-500 hover:bg-red-50 border-t border-gray-100 transition-colors"
                        >
                          Limpar filtro
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Lessons list */}
              <div className="space-y-4">
                {filteredLessons.length === 0 ? (
                  <div className="text-center py-12 animate-fade-in-up">
                    <p className="text-gray-400 text-sm">Nenhuma aula encontrada com os filtros selecionados.</p>
                    <button
                      onClick={() => { setFilterDate(''); setFilterSubject(''); }}
                      className="mt-3 text-sm text-[#3498db] hover:underline"
                    >
                      Limpar filtros
                    </button>
                  </div>
                ) : (
                  filteredLessons.map((lesson, i) => (
                    <div
                      key={lesson.id}
                      className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition-all animate-fade-in-up"
                      style={{ animationDelay: `${i * 0.05}s` }}
                    >
                      <button
                        onClick={() =>
                          setExpandedLesson(expandedLesson === lesson.id ? null : lesson.id)
                        }
                        className="w-full flex items-center gap-4 p-5 text-left"
                      >
                        {/* Subject icon */}
                        <div
                          className={`w-12 h-12 rounded-xl bg-gradient-to-br ${
                            SUBJECT_COLORS[lesson.subject] || 'from-gray-400 to-gray-600'
                          } flex items-center justify-center text-2xl flex-shrink-0 shadow-md`}
                        >
                          {SUBJECT_EMOJIS[lesson.subject] || '📚'}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-[#0d2f4a] truncate">
                            {lesson.title}
                          </h3>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-[#3498db] font-medium bg-[#3498db]/10 px-2 py-0.5 rounded-full">
                              {lesson.subject}
                            </span>
                            <span className="text-xs text-gray-400">
                              {formatDate(lesson.date)}
                            </span>
                          </div>
                        </div>

                        <svg
                          className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ${
                            expandedLesson === lesson.id ? 'rotate-180' : ''
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {/* Expanded content */}
                      {expandedLesson === lesson.id && (
                        <div className="px-5 pb-5 border-t border-gray-100 pt-4 animate-fade-in-up">
                          {lesson.observations && (
                            <div className="mb-4">
                              <h4 className="text-sm font-semibold text-[#0d2f4a] mb-2">
                                📝 Observações
                              </h4>
                              <p className="text-sm text-gray-600 bg-[#f0f4f8] rounded-xl p-4 leading-relaxed">
                                {lesson.observations}
                              </p>
                            </div>
                          )}

                          {lesson.lesson_attachments && lesson.lesson_attachments.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold text-[#0d2f4a] mb-2">
                                📎 Anexos
                              </h4>
                              <div className="space-y-2">
                                {lesson.lesson_attachments.map((att) =>
                                  isImageFile(att.file_name) ? (
                                    <button
                                      key={att.id}
                                      onClick={() => { setLightboxSrc(att.file_url); setLightboxAlt(att.file_name); }}
                                      className="block w-full rounded-xl overflow-hidden bg-[#f0f4f8] hover:ring-2 hover:ring-[#3498db]/40 transition-all cursor-zoom-in"
                                    >
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img
                                        src={att.file_url}
                                        alt={att.file_name}
                                        className="w-full max-h-64 object-contain"
                                      />
                                    </button>
                                  ) : (
                                    <a
                                      key={att.id}
                                      href={att.file_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-3 bg-[#f0f4f8] rounded-xl p-3 hover:bg-[#3498db]/10 transition-colors group"
                                    >
                                      <svg className="w-5 h-5 text-[#3498db]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                      </svg>
                                      <span className="text-sm text-gray-700 group-hover:text-[#3498db] transition-colors truncate">
                                        {att.file_name}
                                      </span>
                                    </a>
                                  ),
                                )}
                              </div>
                            </div>
                          )}

                          {!lesson.observations && (!lesson.lesson_attachments || lesson.lesson_attachments.length === 0) && (
                            <p className="text-sm text-gray-400 text-center py-2">
                              Sem detalhes adicionais para esta aula.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />

      {/* Image lightbox */}
      {lightboxSrc && (
        <ImageLightbox
          src={lightboxSrc}
          alt={lightboxAlt}
          onClose={() => setLightboxSrc(null)}
        />
      )}
    </>
  );
}
