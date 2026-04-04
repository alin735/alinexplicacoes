import { unstable_noStore as noStore } from 'next/cache';
import { type ExamExercisePost } from '@/lib/exam-exercises';
import { getServiceSupabase } from '@/lib/server-bookings';

function mapExerciseRow(row: Record<string, unknown>): ExamExercisePost {
  return {
    id: String(row.id),
    slug: String(row.slug),
    title: String(row.title),
    school_year: String(row.school_year) as ExamExercisePost['school_year'],
    broad_theme: String(row.broad_theme),
    subtheme: String(row.subtheme),
    tags: Array.isArray(row.tags) ? row.tags.map((item) => String(item)) : [],
    summary: String(row.summary || ''),
    seo_description: String(row.seo_description || ''),
    thumbnail_url: String(row.thumbnail_url || ''),
    media_type: String(row.media_type || 'upload') as ExamExercisePost['media_type'],
    video_url: row.video_url ? String(row.video_url) : null,
    tiktok_url: row.tiktok_url ? String(row.tiktok_url) : null,
    tiktok_embed_html: row.tiktok_embed_html ? String(row.tiktok_embed_html) : null,
    is_published: Boolean(row.is_published),
    published_at: row.published_at ? String(row.published_at) : null,
    created_at: String(row.created_at || row.published_at || ''),
  };
}

export async function getPublishedExamExercises() {
  noStore();

  try {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from('exam_exercise_posts')
      .select('*')
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .order('created_at', { ascending: false });

    if (error || !data) {
      return [];
    }

    return data.map((row) => mapExerciseRow(row as Record<string, unknown>));
  } catch {
    return [];
  }
}

export async function getExamExerciseBySlug(slug: string) {
  noStore();

  try {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from('exam_exercise_posts')
      .select('*')
      .eq('slug', slug)
      .eq('is_published', true)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return mapExerciseRow(data as Record<string, unknown>);
  } catch {
    return null;
  }
}
