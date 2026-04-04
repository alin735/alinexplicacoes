'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import RichTextContent from '@/components/RichTextContent';
import { createClient } from '@/lib/supabase';
import { buildTikTokEmbedHtml, createExamExerciseSlug, type ExamExercisePost } from '@/lib/exam-exercises';
import { EXAM_THEME_GROUPS, SCHOOL_YEAR_OPTIONS, type SchoolYearOption } from '@/lib/exam-data';
import type { Profile } from '@/lib/types';

type ExistingExercise = ExamExercisePost;

export default function AdminExamExercisesPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<ExistingExercise[]>([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [schoolYear, setSchoolYear] = useState<SchoolYearOption>('12º ano');
  const [broadTheme, setBroadTheme] = useState(EXAM_THEME_GROUPS['12º ano'][0]?.broadTheme ?? '');
  const [subtheme, setSubtheme] = useState(EXAM_THEME_GROUPS['12º ano'][0]?.subthemes[0] ?? '');
  const [tags, setTags] = useState('');
  const [summary, setSummary] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [mediaType, setMediaType] = useState<'upload' | 'tiktok'>('tiktok');
  const [tiktokUrl, setTiktokUrl] = useState('https://www.tiktok.com/@matematicatop1/video/7602387536530509089');
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [currentThumbnailUrl, setCurrentThumbnailUrl] = useState('/images/exames/resolucao-de-exercicios.png');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string | null>(null);
  const [publishNow, setPublishNow] = useState(true);

  const currentThemeGroups = EXAM_THEME_GROUPS[schoolYear];
  const currentSubthemes = currentThemeGroups.find((group) => group.broadTheme === broadTheme)?.subthemes ?? [];
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState('/images/exames/resolucao-de-exercicios.png');

  useEffect(() => {
    if (!thumbnailFile) {
      setThumbnailPreviewUrl(currentThumbnailUrl || '/images/exames/resolucao-de-exercicios.png');
      return;
    }

    const objectUrl = URL.createObjectURL(thumbnailFile);
    setThumbnailPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [currentThumbnailUrl, thumbnailFile]);

  useEffect(() => {
    const init = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      let activeUser = sessionData.session?.user ?? null;

      if (!activeUser) {
        const { data: userData } = await supabase.auth.getUser();
        activeUser = userData.user ?? null;
      }

      if (!activeUser) {
        router.push('/login');
        return;
      }

      const { data: activeProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', activeUser.id)
        .single();

      if (!activeProfile?.is_admin) {
        router.push('/');
        return;
      }

      setProfile(activeProfile);
      await loadPosts();
      setLoading(false);
    };

    void init();
  }, [router, supabase]);

  const loadPosts = async () => {
    const { data, error: loadError } = await supabase
      .from('exam_exercise_posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (loadError) {
      setError(loadError.message);
      return;
    }

    setPosts(((data || []) as ExistingExercise[]));
  };

  const resetForm = () => {
    setEditingPostId(null);
    setTitle('');
    setSchoolYear('12º ano');
    setBroadTheme(EXAM_THEME_GROUPS['12º ano'][0]?.broadTheme ?? '');
    setSubtheme(EXAM_THEME_GROUPS['12º ano'][0]?.subthemes[0] ?? '');
    setTags('');
    setSummary('');
    setSeoDescription('');
    setThumbnailFile(null);
    setCurrentThumbnailUrl('/images/exames/resolucao-de-exercicios.png');
    setVideoFile(null);
    setCurrentVideoUrl(null);
    setMediaType('tiktok');
    setTiktokUrl('https://www.tiktok.com/@matematicatop1/video/7602387536530509089');
    setPublishNow(true);
  };

  const handleEdit = (post: ExistingExercise) => {
    setEditingPostId(post.id);
    setTitle(post.title);
    setSchoolYear(post.school_year);
    setBroadTheme(post.broad_theme);
    setSubtheme(post.subtheme);
    setTags(post.tags.join(', '));
    setSummary(post.summary);
    setSeoDescription(post.seo_description);
    setMediaType(post.media_type);
    setTiktokUrl(post.tiktok_url || '');
    setThumbnailFile(null);
    setCurrentThumbnailUrl(post.thumbnail_url || '/images/exames/resolucao-de-exercicios.png');
    setVideoFile(null);
    setCurrentVideoUrl(post.video_url);
    setPublishNow(post.is_published);
    setMessage('');
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (post: ExistingExercise) => {
    const confirmed = window.confirm(`Queres remover a publicação "${post.title}"?`);
    if (!confirmed) return;

    setDeletingPostId(post.id);
    setMessage('');
    setError('');

    try {
      const { error: deleteError } = await supabase
        .from('exam_exercise_posts')
        .delete()
        .eq('id', post.id);

      if (deleteError) {
        throw deleteError;
      }

      if (editingPostId === post.id) {
        resetForm();
      }

      setMessage('Publicação removida com sucesso.');
      await loadPosts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível remover a publicação.');
    } finally {
      setDeletingPostId(null);
    }
  };

  const uploadFile = async (bucket: string, file: File, folder: string) => {
    const extension = file.name.split('.').pop() || 'bin';
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
    const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file, {
      upsert: false,
      cacheControl: '3600',
    });

    if (uploadError) {
      throw uploadError;
    }

    return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage('');
    setError('');

    try {
      if (!title.trim()) {
        throw new Error('Preenche o título do exercício.');
      }

      if (!summary.trim()) {
        throw new Error('Preenche o resumo curto do exercício.');
      }

      if (!seoDescription.trim()) {
        throw new Error('Preenche a explicação/descrição SEO do exercício.');
      }

      if (mediaType === 'tiktok' && !tiktokUrl.trim()) {
        throw new Error('Indica o link do TikTok.');
      }

      if (mediaType === 'upload' && !videoFile) {
        throw new Error('Seleciona o vídeo para upload.');
      }

      const slugBase = createExamExerciseSlug(title);
      const slug = `${slugBase || 'exercicio-de-exame'}-${Date.now().toString().slice(-6)}`;

      let thumbnailUrl = currentThumbnailUrl || '/images/exames/resolucao-de-exercicios.png';
      let videoUrl: string | null = currentVideoUrl;

      if (thumbnailFile) {
        thumbnailUrl = await uploadFile('exam-media', thumbnailFile, 'thumbnails');
      }

      if (mediaType === 'upload' && videoFile) {
        videoUrl = await uploadFile('exam-media', videoFile, 'videos');
      }

      const parsedTags = tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean);

      const nowIso = new Date().toISOString();

      const payload = {
        title: title.trim(),
        school_year: schoolYear,
        broad_theme: broadTheme,
        subtheme,
        tags: parsedTags,
        summary: summary.trim(),
        seo_description: seoDescription.trim(),
        thumbnail_url: thumbnailUrl,
        media_type: mediaType,
        video_url: mediaType === 'upload' ? videoUrl : null,
        tiktok_url: mediaType === 'tiktok' ? tiktokUrl.trim() : null,
        tiktok_embed_html: mediaType === 'tiktok' ? buildTikTokEmbedHtml(tiktokUrl.trim()) : null,
        is_published: publishNow,
        published_at: publishNow ? nowIso : null,
      };

      if (editingPostId) {
        const { error: updateError } = await supabase
          .from('exam_exercise_posts')
          .update(payload)
          .eq('id', editingPostId);

        if (updateError) {
          throw updateError;
        }
      } else {
        const { error: insertError } = await supabase.from('exam_exercise_posts').insert({
          ...payload,
          slug,
          created_by: profile?.id ?? null,
        });

        if (insertError) {
          throw insertError;
        }
      }

      setMessage(editingPostId ? 'Exercício atualizado com sucesso.' : 'Exercício guardado com sucesso.');
      resetForm();
      await loadPosts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível guardar o exercício.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-[#f4f7fb] pt-32">
          <div className="max-w-6xl mx-auto px-4">
            <div className="rounded-[2rem] border border-black/10 bg-white p-8 shadow-[0_24px_60px_rgba(0,0,0,0.08)]">
              <p className="text-sm text-gray-500">A carregar área de exames...</p>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#f4f7fb] pt-28">
        <div className="max-w-6xl mx-auto px-4 pb-16">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#3f6c93] mb-3">
                Administração
              </p>
              <h1 className="text-4xl font-black text-[#111111]">Exames</h1>
              <p className="text-sm text-gray-600 mt-2">
                Publica vídeos e páginas de resolução de exercícios do Exame Nacional.
              </p>
            </div>

            <Link
              href="/admin"
              className="inline-flex items-center justify-center rounded-2xl border border-black/15 bg-white px-4 py-3 text-sm font-semibold text-[#111111] hover:bg-black/5"
            >
              Voltar ao painel principal
            </Link>
          </div>

          {message && (
            <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {message}
            </div>
          )}

          {error && (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
            <section className="rounded-[2rem] border border-black/10 bg-white p-6 sm:p-8 shadow-[0_24px_60px_rgba(0,0,0,0.08)]">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-2xl font-black text-[#111111]">
                  {editingPostId ? 'Editar exercício' : 'Publicar exercício'}
                </h2>
                {editingPostId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-2xl border border-black/10 bg-[#f7f9fc] px-4 py-2 text-sm font-semibold text-[#111111] hover:bg-black/5"
                  >
                    Cancelar edição
                  </button>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Título</label>
                  <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    className="w-full rounded-2xl border border-black/10 bg-[#f7f9fc] px-4 py-3 text-sm outline-none transition-all focus:border-[#3f6c93] focus:ring-2 focus:ring-[#3f6c93]/20"
                    placeholder="Ex: Funções: exercício resolvido do Exame Nacional"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Ano</label>
                    <select
                      value={schoolYear}
                      onChange={(event) => {
                        const nextSchoolYear = event.target.value as SchoolYearOption;
                        setSchoolYear(nextSchoolYear);
                        setBroadTheme(EXAM_THEME_GROUPS[nextSchoolYear][0]?.broadTheme ?? '');
                        setSubtheme(EXAM_THEME_GROUPS[nextSchoolYear][0]?.subthemes[0] ?? '');
                      }}
                      className="w-full rounded-2xl border border-black/10 bg-[#f7f9fc] px-4 py-3 text-sm outline-none transition-all focus:border-[#3f6c93] focus:ring-2 focus:ring-[#3f6c93]/20"
                    >
                      {SCHOOL_YEAR_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Tema geral</label>
                    <select
                      value={broadTheme}
                      onChange={(event) => {
                        const nextBroadTheme = event.target.value;
                        setBroadTheme(nextBroadTheme);
                        setSubtheme(
                          currentThemeGroups.find((group) => group.broadTheme === nextBroadTheme)?.subthemes[0] ?? '',
                        );
                      }}
                      className="w-full rounded-2xl border border-black/10 bg-[#f7f9fc] px-4 py-3 text-sm outline-none transition-all focus:border-[#3f6c93] focus:ring-2 focus:ring-[#3f6c93]/20"
                    >
                      {currentThemeGroups.map((group) => (
                        <option key={group.broadTheme} value={group.broadTheme}>
                          {group.broadTheme}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Subtema</label>
                    <select
                      value={subtheme}
                      onChange={(event) => setSubtheme(event.target.value)}
                      className="w-full rounded-2xl border border-black/10 bg-[#f7f9fc] px-4 py-3 text-sm outline-none transition-all focus:border-[#3f6c93] focus:ring-2 focus:ring-[#3f6c93]/20"
                    >
                      {currentSubthemes.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Termos de pesquisa</label>
                  <input
                    value={tags}
                    onChange={(event) => setTags(event.target.value)}
                    className="w-full rounded-2xl border border-black/10 bg-[#f7f9fc] px-4 py-3 text-sm outline-none transition-all focus:border-[#3f6c93] focus:ring-2 focus:ring-[#3f6c93]/20"
                    placeholder="Ex: funções, exame nacional, limites, 12º ano"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Resumo curto</label>
                  <textarea
                    value={summary}
                    onChange={(event) => setSummary(event.target.value)}
                    rows={3}
                    className="w-full rounded-2xl border border-black/10 bg-[#f7f9fc] px-4 py-3 text-sm outline-none transition-all focus:border-[#3f6c93] focus:ring-2 focus:ring-[#3f6c93]/20"
                    placeholder="Texto curto que aparece no card público."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Explicação / descrição SEO</label>
                  <textarea
                    value={seoDescription}
                    onChange={(event) => setSeoDescription(event.target.value)}
                    rows={10}
                    className="w-full rounded-2xl border border-black/10 bg-[#f7f9fc] px-4 py-3 text-sm outline-none transition-all focus:border-[#3f6c93] focus:ring-2 focus:ring-[#3f6c93]/20"
                    placeholder={'Podes usar parágrafos, **negrito**, *itálico* e listas com -\n\nExemplo:\n\nPara resolver este exercício...\n\n**Passo 1:** identificar...\n\n- Primeiro ponto\n- Segundo ponto'}
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    Aceita formatação simples: linhas em branco para separar parágrafos, <span className="font-semibold">**negrito**</span>, <span className="italic">*itálico*</span> e listas com <span className="font-semibold">-</span>.
                  </p>
                </div>

                <div className="rounded-[1.5rem] border border-black/10 bg-[#fafafa] p-4">
                  <p className="mb-3 text-sm font-semibold text-[#111111]">Pré-visualização da explicação</p>
                  {seoDescription.trim() ? (
                    <RichTextContent content={seoDescription} className="text-sm" />
                  ) : (
                    <p className="text-sm text-gray-500">A pré-visualização aparece aqui à medida que escreves.</p>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Thumbnail</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(event) => setThumbnailFile(event.target.files?.[0] ?? null)}
                      className="block w-full text-sm text-gray-600 file:mr-4 file:rounded-2xl file:border-0 file:bg-[#111111] file:px-4 file:py-3 file:text-sm file:font-semibold file:text-white hover:file:bg-[#1d2b38]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo de vídeo</label>
                    <select
                      value={mediaType}
                      onChange={(event) => setMediaType(event.target.value as 'upload' | 'tiktok')}
                      className="w-full rounded-2xl border border-black/10 bg-[#f7f9fc] px-4 py-3 text-sm outline-none transition-all focus:border-[#3f6c93] focus:ring-2 focus:ring-[#3f6c93]/20"
                    >
                      <option value="tiktok">Embed do TikTok</option>
                      <option value="upload">Upload para storage</option>
                    </select>
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-black/10 bg-[#fafafa] p-4">
                  <p className="mb-3 text-sm font-semibold text-[#111111]">Pré-visualização guardada</p>
                  <div className="grid gap-4 md:grid-cols-[140px_1fr] md:items-start">
                    <div className="relative aspect-[4/3] overflow-hidden rounded-[1.25rem] border border-black/10 bg-white">
                      <Image
                        src={thumbnailPreviewUrl || '/images/exames/resolucao-de-exercicios.png'}
                        alt="Pré-visualização da thumbnail"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p>
                        <span className="font-semibold text-[#111111]">Tipo:</span>{' '}
                        {mediaType === 'tiktok' ? 'TikTok' : 'Upload'}
                      </p>
                      {mediaType === 'tiktok' ? (
                        <p className="break-all">
                          <span className="font-semibold text-[#111111]">Link guardado:</span>{' '}
                          {tiktokUrl || 'Sem link'}
                        </p>
                      ) : (
                        <p className="break-all">
                          <span className="font-semibold text-[#111111]">Vídeo guardado:</span>{' '}
                          {videoFile?.name || currentVideoUrl || 'Sem vídeo'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {mediaType === 'tiktok' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Link do TikTok</label>
                    <input
                      value={tiktokUrl}
                      onChange={(event) => setTiktokUrl(event.target.value)}
                      className="w-full rounded-2xl border border-black/10 bg-[#f7f9fc] px-4 py-3 text-sm outline-none transition-all focus:border-[#3f6c93] focus:ring-2 focus:ring-[#3f6c93]/20"
                      placeholder="https://www.tiktok.com/@..."
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Vídeo</label>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(event) => setVideoFile(event.target.files?.[0] ?? null)}
                      className="block w-full text-sm text-gray-600 file:mr-4 file:rounded-2xl file:border-0 file:bg-[#111111] file:px-4 file:py-3 file:text-sm file:font-semibold file:text-white hover:file:bg-[#1d2b38]"
                    />
                    <p className="mt-2 text-xs text-gray-500">Suporta uploads grandes. Mantive a estrutura preparada para ficheiros até cerca de 300 MB.</p>
                  </div>
                )}

                <label className="flex items-center gap-3 rounded-2xl border border-black/10 bg-[#f7f9fc] px-4 py-3 text-sm text-[#111111]">
                  <input
                    type="checkbox"
                    checked={publishNow}
                    onChange={(event) => setPublishNow(event.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-[#111111] focus:ring-[#3f6c93]"
                  />
                  Publicar imediatamente
                </label>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center rounded-2xl bg-[#111111] px-6 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-[0_20px_45px_rgba(17,17,17,0.18)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? 'A guardar...' : editingPostId ? 'Guardar alterações' : 'Guardar exercício'}
                </button>
              </form>
            </section>

            <section className="rounded-[2rem] border border-black/10 bg-white p-6 sm:p-8 shadow-[0_24px_60px_rgba(0,0,0,0.08)]">
              <div className="flex items-center justify-between gap-3 mb-5">
                <h2 className="text-2xl font-black text-[#111111]">Exercícios publicados</h2>
                <button
                  type="button"
                  onClick={() => void loadPosts()}
                  className="rounded-2xl border border-black/10 bg-[#f7f9fc] px-4 py-2 text-sm font-semibold text-[#111111] hover:bg-black/5"
                >
                  Atualizar
                </button>
              </div>

              <div className="space-y-4">
                {posts.length === 0 ? (
                  <div className="rounded-[1.5rem] border border-dashed border-black/15 bg-[#fafafa] px-5 py-6 text-sm text-gray-500">
                    Ainda não existem exercícios nesta tabela.
                  </div>
                ) : (
                  posts.map((post) => (
                    <article key={post.id} className="rounded-[1.5rem] border border-black/10 bg-[#fafafa] p-5">
                      <div className="grid gap-4 md:grid-cols-[132px_1fr]">
                        <div className="relative aspect-[4/3] overflow-hidden rounded-[1.25rem] border border-black/10 bg-white">
                          <Image
                            src={post.thumbnail_url || '/images/exames/resolucao-de-exercicios.png'}
                            alt={post.title}
                            fill
                            className="object-cover"
                          />
                        </div>

                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#3f6c93] mb-2">
                            {post.school_year} · {post.broad_theme}
                          </p>
                          <h3 className="text-lg font-bold text-[#111111] mb-1">{post.title}</h3>
                          <p className="text-sm text-gray-600 mb-3">{post.summary}</p>
                          {post.media_type === 'tiktok' && post.tiktok_url && (
                            <p className="mb-3 break-all text-xs text-gray-500">
                              {post.tiktok_url}
                            </p>
                          )}
                          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                            <span className="rounded-full bg-white px-3 py-1 border border-black/10">
                              {post.media_type === 'tiktok' ? 'TikTok' : 'Upload'}
                            </span>
                            <span className="rounded-full bg-white px-3 py-1 border border-black/10">
                              {post.is_published ? 'Publicado' : 'Rascunho'}
                            </span>
                            {post.media_type === 'tiktok' && post.tiktok_url && (
                              <a
                                href={post.tiktok_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded-full border border-black/10 bg-white px-3 py-1 text-[#111111]"
                              >
                                Abrir TikTok
                              </a>
                            )}
                            <Link
                              href={`/exames-nacionais/resolucao-de-exercicios/${post.slug}`}
                              className="rounded-full bg-[#111111] px-3 py-1 text-white"
                            >
                              Ver página
                            </Link>
                            <button
                              type="button"
                              onClick={() => handleEdit(post)}
                              className="rounded-full border border-black/10 bg-white px-3 py-1 text-[#111111]"
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleDelete(post)}
                              disabled={deletingPostId === post.id}
                              className="rounded-full border border-red-200 bg-white px-3 py-1 text-red-600 disabled:opacity-60"
                            >
                              {deletingPostId === post.id ? 'A remover...' : 'Remover'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
