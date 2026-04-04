import type { SchoolYearOption } from '@/lib/exam-data';
import { normalizeSearchValue } from '@/lib/exam-data';

export type ExamExerciseMediaType = 'upload' | 'tiktok';

export type ExamExercisePost = {
  id: string;
  slug: string;
  title: string;
  school_year: SchoolYearOption;
  broad_theme: string;
  subtheme: string;
  tags: string[];
  summary: string;
  seo_description: string;
  thumbnail_url: string;
  media_type: ExamExerciseMediaType;
  video_url: string | null;
  tiktok_url: string | null;
  tiktok_embed_html: string | null;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
};

export function createExamExerciseSlug(title: string) {
  return normalizeSearchValue(title)
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function getTikTokVideoId(url: string) {
  const match = url.match(/\/video\/(\d+)/) || url.match(/(\d{18,20})/);
  return match?.[1] ?? null;
}

export function buildTikTokEmbedHtml(url: string) {
  const videoId = getTikTokVideoId(url);
  if (!videoId) return null;

  return `<blockquote class="tiktok-embed" cite="${url}" data-video-id="${videoId}" style="max-width: 605px; min-width: 325px;"><section><a target="_blank" title="@matematicatop1" href="https://www.tiktok.com/@matematicatop1?refer=embed">@matematicatop1</a></section></blockquote>`;
}

export function buildExerciseSearchText(post: Pick<ExamExercisePost, 'title' | 'school_year' | 'broad_theme' | 'subtheme' | 'tags' | 'summary'>) {
  return normalizeSearchValue(
    [post.title, post.school_year, post.broad_theme, post.subtheme, post.summary, ...post.tags].join(' '),
  );
}

export const DEFAULT_EXAM_EXERCISES: ExamExercisePost[] = [
  {
    id: 'local-seed-exam-exercise-1',
    slug: 'funcoes-exercicio-resolvido-exame-matematica-a',
    title: 'Funções: exercício resolvido do Exame Nacional de Matemática A',
    school_year: '12º ano',
    broad_theme: 'Funções Reais de Variável Real',
    subtheme: 'Limites e continuidade',
    tags: ['funcoes', 'matematica a', 'exame nacional', 'limites', 'continuidade', '12 ano'],
    summary:
      'Vídeo com resolução passo a passo de um exercício de exame sobre funções, com foco na interpretação do enunciado e na estratégia de resolução.',
    seo_description:
      'Exercício resolvido do Exame Nacional de Matemática A sobre funções reais de variável real, com explicação detalhada, raciocínio passo a passo e ligação ao tema de limites e continuidade.',
    thumbnail_url: '/images/exames/resolucao-de-exercicios.png',
    media_type: 'tiktok',
    video_url: null,
    tiktok_url: 'https://www.tiktok.com/@matematicatop1/video/7602387536530509089',
    tiktok_embed_html: buildTikTokEmbedHtml('https://www.tiktok.com/@matematicatop1/video/7602387536530509089'),
    is_published: true,
    published_at: '2026-04-03T19:53:25.000Z',
    created_at: '2026-04-03T19:53:25.000Z',
  },
];
