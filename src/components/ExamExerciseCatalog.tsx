'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { EXAM_THEME_GROUPS, normalizeSearchValue, SCHOOL_YEAR_OPTIONS } from '@/lib/exam-data';
import { buildExerciseSearchText, type ExamExercisePost } from '@/lib/exam-exercises';

type ExamExerciseCatalogProps = {
  posts: ExamExercisePost[];
};

export default function ExamExerciseCatalog({ posts }: ExamExerciseCatalogProps) {
  const [query, setQuery] = useState('');
  const [schoolYear, setSchoolYear] = useState('');
  const [broadTheme, setBroadTheme] = useState('');

  const availableThemes = useMemo(() => {
    if (schoolYear && schoolYear in EXAM_THEME_GROUPS) {
      return EXAM_THEME_GROUPS[schoolYear as keyof typeof EXAM_THEME_GROUPS]
        .map((group) => group.broadTheme)
        .sort((a, b) => a.localeCompare(b, 'pt-PT'));
    }

    return Array.from(new Set(posts.map((post) => post.broad_theme))).sort((a, b) => a.localeCompare(b, 'pt-PT'));
  }, [posts, schoolYear]);

  const filteredPosts = useMemo(() => {
    const normalizedQuery = normalizeSearchValue(query);

    return posts.filter((post) => {
      if (schoolYear && post.school_year !== schoolYear) {
        return false;
      }

      if (broadTheme && post.broad_theme !== broadTheme) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return buildExerciseSearchText(post).includes(normalizedQuery);
    });
  }, [broadTheme, posts, query, schoolYear]);

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-black/10 bg-white p-6 sm:p-8 shadow-[0_24px_60px_rgba(0,0,0,0.08)]">
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr_0.8fr]">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Pesquisar exercício</label>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Ex: derivadas, probabilidades, 12º ano..."
              className="w-full rounded-2xl border border-black/10 bg-[#f7f9fc] px-4 py-3 text-sm text-[#111111] outline-none transition-all focus:border-[#3f6c93] focus:ring-2 focus:ring-[#3f6c93]/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Ano escolar</label>
            <select
              value={schoolYear}
              onChange={(event) => {
                setSchoolYear(event.target.value);
                setBroadTheme('');
              }}
              className="w-full rounded-2xl border border-black/10 bg-[#f7f9fc] px-4 py-3 text-sm text-[#111111] outline-none transition-all focus:border-[#3f6c93] focus:ring-2 focus:ring-[#3f6c93]/20"
            >
              <option value="">Todos os anos</option>
              {SCHOOL_YEAR_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tema</label>
            <select
              value={broadTheme}
              onChange={(event) => setBroadTheme(event.target.value)}
              className="w-full rounded-2xl border border-black/10 bg-[#f7f9fc] px-4 py-3 text-sm text-[#111111] outline-none transition-all focus:border-[#3f6c93] focus:ring-2 focus:ring-[#3f6c93]/20"
            >
              <option value="">Todos os temas</option>
              {availableThemes.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filteredPosts.map((post) => (
          <article
            key={post.id}
            className="overflow-hidden rounded-[2rem] border border-black/10 bg-white shadow-[0_24px_60px_rgba(0,0,0,0.08)]"
          >
            <div className="relative aspect-[4/3] overflow-hidden bg-[#d7e6f3]">
              <Image
                src={post.thumbnail_url || '/images/exames/resolucao-de-exercicios.png'}
                alt={post.title}
                fill
                className="object-cover"
              />
            </div>

            <div className="p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#3f6c93] mb-3">
                {post.school_year} · {post.broad_theme}
              </p>
              <h2 className="text-xl font-black text-[#111111] leading-tight">{post.title}</h2>

              <Link
                href={`/exames-nacionais/resolucao-de-exercicios/${post.slug}`}
                className="mt-5 inline-flex items-center justify-center rounded-2xl bg-[#111111] px-4 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-[0_20px_45px_rgba(17,17,17,0.18)]"
              >
                Abrir exercício
              </Link>
            </div>
          </article>
        ))}
      </section>

      {filteredPosts.length === 0 && (
        <section className="rounded-[2rem] border border-dashed border-black/20 bg-white px-6 py-10 text-center text-sm text-gray-600">
          Não encontrámos exercícios para esta pesquisa. Tenta outro tema ou outro ano escolar.
        </section>
      )}
    </div>
  );
}
