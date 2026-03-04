'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { createClient } from '@/lib/supabase';
import type { Lesson, LessonAttachment } from '@/lib/types';

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

export default function AulasPage() {
  const [user, setUser] = useState<any>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'date' | 'recent'>('recent');
  const [expandedLesson, setExpandedLesson] = useState<string | null>(null);
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

  const sortedLessons = [...lessons].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
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
        <div className="bg-gradient-to-r from-[#0d2f4a] to-[#1a5276] py-12 px-4">
          <div className="max-w-4xl mx-auto text-center">
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
              {/* Sort controls */}
              <div className="flex items-center justify-between mb-6">
                <p className="text-sm text-gray-500">
                  <strong className="text-[#0d2f4a]">{lessons.length}</strong>{' '}
                  {lessons.length === 1 ? 'aula' : 'aulas'}
                </p>
                <div className="flex bg-white rounded-xl p-1 shadow-sm">
                  <button
                    onClick={() => setSortBy('recent')}
                    className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                      sortBy === 'recent'
                        ? 'bg-gradient-to-r from-[#3498db] to-[#5dade2] text-white shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Mais recente
                  </button>
                  <button
                    onClick={() => setSortBy('date')}
                    className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                      sortBy === 'date'
                        ? 'bg-gradient-to-r from-[#3498db] to-[#5dade2] text-white shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Por data
                  </button>
                </div>
              </div>

              {/* Lessons list */}
              <div className="space-y-4">
                {sortedLessons.map((lesson, i) => (
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
                              {lesson.lesson_attachments.map((att) => (
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
                              ))}
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
                ))}
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
