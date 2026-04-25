'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import RichTextContent from '@/components/RichTextContent';
import { getSeedBlogPosts, createBlogPostSlug, type BlogCategory, type BlogPost } from '@/lib/blog-posts';
import { createClient } from '@/lib/supabase';
import type { Profile } from '@/lib/types';

const BLOG_CATEGORIES: BlogCategory[] = ['Exame Nacional', 'Métodos de estudo', 'Matemática A'];

export default function AdminBlogPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState<BlogCategory>('Exame Nacional');
  const [excerpt, setExcerpt] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [content, setContent] = useState('');
  const [readTime, setReadTime] = useState('4 min');
  const [coverImageAlt, setCoverImageAlt] = useState('');
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [currentCoverImageUrl, setCurrentCoverImageUrl] = useState('/images/exames/o-que-sai-nos-exames.png');
  const [coverPreviewUrl, setCoverPreviewUrl] = useState('/images/exames/o-que-sai-nos-exames.png');
  const [publishNow, setPublishNow] = useState(true);

  useEffect(() => {
    if (!coverImageFile) {
      setCoverPreviewUrl(currentCoverImageUrl || '/images/exames/o-que-sai-nos-exames.png');
      return;
    }

    const objectUrl = URL.createObjectURL(coverImageFile);
    setCoverPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [currentCoverImageUrl, coverImageFile]);

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

      const { data: activeProfile } = await supabase.from('profiles').select('*').eq('id', activeUser.id).single();

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
    const seedPosts = getSeedBlogPosts();
    const { data, error: loadError } = await supabase
      .from('blog_posts')
      .select('*')
      .order('published_at', { ascending: false })
      .order('created_at', { ascending: false });

    if (loadError) {
      setPosts(seedPosts);
      setError(loadError.message);
      return;
    }

    const dbPosts: BlogPost[] = ((data || []) as Record<string, unknown>[]).map((row) => ({
      id: String(row.id),
      slug: String(row.slug),
      title: String(row.title),
      excerpt: String(row.excerpt || ''),
      seo_description: String(row.seo_description || ''),
      content: String(row.content || ''),
      published_at: row.published_at ? String(row.published_at) : null,
      created_at: String(row.created_at || ''),
      updated_at: row.updated_at ? String(row.updated_at) : null,
      category: String(row.category || 'Matemática A') as BlogCategory,
      cover_image_url: String(row.cover_image_url || '/images/exames/o-que-sai-nos-exames.png'),
      cover_image_alt: String(row.cover_image_alt || ''),
      read_time: String(row.read_time || '4 min'),
      is_published: Boolean(row.is_published),
    }));

    const merged = new Map<string, BlogPost>();
    seedPosts.forEach((post) => merged.set(post.slug, post));
    dbPosts.forEach((post) => merged.set(post.slug, post));
    setPosts(
      Array.from(merged.values()).sort(
        (a, b) => new Date(b.published_at || b.created_at).getTime() - new Date(a.published_at || a.created_at).getTime(),
      ),
    );
  };

  const resetForm = () => {
    setEditingPostId(null);
    setTitle('');
    setSlug('');
    setCategory('Exame Nacional');
    setExcerpt('');
    setSeoDescription('');
    setContent('');
    setReadTime('4 min');
    setCoverImageAlt('');
    setCoverImageFile(null);
    setCurrentCoverImageUrl('/images/exames/o-que-sai-nos-exames.png');
    setPublishNow(true);
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

  const handleEdit = (post: BlogPost) => {
    setEditingPostId(post.id);
    setTitle(post.title);
    setSlug(post.slug);
    setCategory(post.category);
    setExcerpt(post.excerpt);
    setSeoDescription(post.seo_description);
    setContent(post.content);
    setReadTime(post.read_time);
    setCoverImageAlt(post.cover_image_alt);
    setCoverImageFile(null);
    setCurrentCoverImageUrl(post.cover_image_url);
    setPublishNow(post.is_published);
    setMessage('');
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (post: BlogPost) => {
    if (post.id.startsWith('seed-')) {
      setError('Os artigos seed não podem ser removidos pelo admin.');
      return;
    }

    const confirmed = window.confirm(`Queres remover o artigo "${post.title}"?`);
    if (!confirmed) return;

    setDeletingPostId(post.id);
    setMessage('');
    setError('');

    try {
      const { error: deleteError } = await supabase.from('blog_posts').delete().eq('id', post.id);
      if (deleteError) throw deleteError;

      if (editingPostId === post.id) {
        resetForm();
      }

      setMessage('Artigo removido com sucesso.');
      await loadPosts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível remover o artigo.');
    } finally {
      setDeletingPostId(null);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage('');
    setError('');

    try {
      if (!title.trim()) throw new Error('Preenche o título do artigo.');
      if (!excerpt.trim()) throw new Error('Preenche a descrição curta do artigo.');
      if (!seoDescription.trim()) throw new Error('Preenche a meta description do artigo.');
      if (!content.trim()) throw new Error('Preenche o conteúdo do artigo.');

      const finalSlugBase = slug.trim() || createBlogPostSlug(title);
      if (!finalSlugBase) throw new Error('Não foi possível gerar o slug do artigo.');

      let coverImageUrl = currentCoverImageUrl || '/images/exames/o-que-sai-nos-exames.png';
      if (coverImageFile) {
        coverImageUrl = await uploadFile('exam-media', coverImageFile, 'blog-covers');
      }

      const payload = {
        title: title.trim(),
        slug: finalSlugBase,
        category,
        excerpt: excerpt.trim(),
        seo_description: seoDescription.trim(),
        content: content.trim(),
        read_time: readTime.trim() || '4 min',
        cover_image_url: coverImageUrl,
        cover_image_alt: coverImageAlt.trim() || title.trim(),
        is_published: publishNow,
        published_at: publishNow ? new Date().toISOString() : null,
      };

      if (editingPostId && !editingPostId.startsWith('seed-')) {
        const { error: updateError } = await supabase.from('blog_posts').update(payload).eq('id', editingPostId);
        if (updateError) throw updateError;
        setMessage('Artigo atualizado com sucesso.');
      } else if (editingPostId?.startsWith('seed-')) {
        throw new Error('Os artigos seed não podem ser editados por cima. Cria um artigo novo com outro slug.');
      } else {
        const { error: insertError } = await supabase.from('blog_posts').insert(payload);
        if (insertError) throw insertError;
        setMessage('Artigo criado com sucesso.');
      }

      resetForm();
      await loadPosts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível guardar o artigo.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-[#f5f5f5] pt-28">
          <div className="mx-auto max-w-6xl px-4 py-16 text-center text-gray-500">A carregar…</div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#f5f5f5] pt-28">
        <div className="mx-auto max-w-6xl px-4 pb-16">
          <div className="mb-8 flex items-center justify-between gap-4">
            <div>
              <Link href="/admin" className="text-sm font-semibold text-[#3f6c93] hover:text-[#294a67]">
                ← Voltar ao admin
              </Link>
              <h1 className="mt-2 text-4xl font-black text-[#000000]">Blog</h1>
              <p className="mt-2 text-gray-600">Cria, edita e publica artigos do site.</p>
            </div>
            {profile && (
              <div className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-gray-600 shadow-[0_18px_45px_rgba(0,0,0,0.06)]">
                Admin: <span className="font-semibold text-[#111111]">{profile.full_name || profile.username}</span>
              </div>
            )}
          </div>

          <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr] items-start">
            <form onSubmit={handleSubmit} className="rounded-[2rem] border border-black/10 bg-white p-6 sm:p-8 shadow-[0_24px_60px_rgba(0,0,0,0.08)]">
              <h2 className="mb-6 text-2xl font-black text-[#111111]">
                {editingPostId ? 'Editar artigo' : 'Novo artigo'}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Título</label>
                  <input value={title} onChange={(e) => { const next = e.target.value; setTitle(next); if (!editingPostId) setSlug(createBlogPostSlug(next)); }} className="w-full rounded-2xl border border-black/10 bg-[#f7f9fc] px-4 py-3 text-sm text-[#111111] outline-none focus:border-[#3f6c93] focus:ring-2 focus:ring-[#3f6c93]/20" />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">Slug</label>
                    <input value={slug} onChange={(e) => setSlug(createBlogPostSlug(e.target.value))} className="w-full rounded-2xl border border-black/10 bg-[#f7f9fc] px-4 py-3 text-sm text-[#111111] outline-none focus:border-[#3f6c93] focus:ring-2 focus:ring-[#3f6c93]/20" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">Categoria</label>
                    <select value={category} onChange={(e) => setCategory(e.target.value as BlogCategory)} className="w-full rounded-2xl border border-black/10 bg-[#f7f9fc] px-4 py-3 text-sm text-[#111111] outline-none focus:border-[#3f6c93] focus:ring-2 focus:ring-[#3f6c93]/20">
                      {BLOG_CATEGORIES.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Descrição curta</label>
                  <textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} rows={3} className="w-full rounded-2xl border border-black/10 bg-[#f7f9fc] px-4 py-3 text-sm text-[#111111] outline-none focus:border-[#3f6c93] focus:ring-2 focus:ring-[#3f6c93]/20" />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Meta description</label>
                  <textarea value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} rows={3} className="w-full rounded-2xl border border-black/10 bg-[#f7f9fc] px-4 py-3 text-sm text-[#111111] outline-none focus:border-[#3f6c93] focus:ring-2 focus:ring-[#3f6c93]/20" />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">Tempo de leitura</label>
                    <input value={readTime} onChange={(e) => setReadTime(e.target.value)} className="w-full rounded-2xl border border-black/10 bg-[#f7f9fc] px-4 py-3 text-sm text-[#111111] outline-none focus:border-[#3f6c93] focus:ring-2 focus:ring-[#3f6c93]/20" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">Texto alternativo da capa</label>
                    <input value={coverImageAlt} onChange={(e) => setCoverImageAlt(e.target.value)} className="w-full rounded-2xl border border-black/10 bg-[#f7f9fc] px-4 py-3 text-sm text-[#111111] outline-none focus:border-[#3f6c93] focus:ring-2 focus:ring-[#3f6c93]/20" />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Imagem de capa</label>
                  <input type="file" accept="image/*" onChange={(e) => setCoverImageFile(e.target.files?.[0] || null)} className="block w-full text-sm text-gray-600" />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Conteúdo</label>
                  <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={18} className="w-full rounded-2xl border border-black/10 bg-[#f7f9fc] px-4 py-3 text-sm text-[#111111] outline-none focus:border-[#3f6c93] focus:ring-2 focus:ring-[#3f6c93]/20" />
                  <p className="mt-2 text-xs text-gray-500">Suporta parágrafos, `## subtítulos`, `**negrito**`, `*itálico*`, listas com `-` e links `[texto](/rota)`.</p>
                </div>

                <label className="flex items-center gap-3 text-sm text-gray-700">
                  <input type="checkbox" checked={publishNow} onChange={(e) => setPublishNow(e.target.checked)} className="h-4 w-4 rounded border-black/20" />
                  Publicar já
                </label>

                <div className="flex flex-wrap gap-3 pt-2">
                  <button type="submit" disabled={submitting} className="rounded-2xl bg-[#111111] px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-[#1d2b38] disabled:cursor-not-allowed disabled:opacity-60">
                    {submitting ? 'A guardar...' : editingPostId ? 'Guardar alterações' : 'Criar artigo'}
                  </button>
                  {editingPostId && (
                    <button type="button" onClick={resetForm} className="rounded-2xl border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-[#111111]">
                      Cancelar edição
                    </button>
                  )}
                </div>

                {message && <p className="text-sm text-emerald-700">{message}</p>}
                {error && <p className="text-sm text-red-600">{error}</p>}
              </div>
            </form>

            <div className="space-y-6">
              <section className="overflow-hidden rounded-[2rem] border border-black/10 bg-white shadow-[0_24px_60px_rgba(0,0,0,0.08)]">
                <div className="relative aspect-[16/8] bg-[#d7e6f3]">
                  <Image src={coverPreviewUrl} alt={coverImageAlt || title || 'Pré-visualização do artigo'} fill className="object-cover" />
                </div>
                <div className="p-6">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#5b7da3]">
                    {category} · {readTime}
                  </p>
                  <h2 className="mb-3 text-3xl font-black text-[#111111]">{title || 'Título do artigo'}</h2>
                  <p className="text-sm leading-relaxed text-gray-600">{excerpt || 'A descrição curta aparece aqui.'}</p>
                </div>
              </section>

              <section className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-[0_24px_60px_rgba(0,0,0,0.08)]">
                <h2 className="mb-4 text-2xl font-black text-[#111111]">Pré-visualização do conteúdo</h2>
                <RichTextContent content={content || 'O conteúdo do artigo aparece aqui.'} />
              </section>

              <section className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-[0_24px_60px_rgba(0,0,0,0.08)]">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <h2 className="text-2xl font-black text-[#111111]">Artigos</h2>
                  <button type="button" onClick={() => void loadPosts()} className="rounded-2xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-[#111111]">
                    Atualizar
                  </button>
                </div>

                <div className="space-y-4">
                  {posts.map((post) => (
                    <article key={post.slug} className="rounded-[1.5rem] border border-black/10 bg-[#fafafa] p-5">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#5b7da3]">
                        {post.category} · {post.read_time}
                      </p>
                      <h3 className="mb-2 text-2xl font-black text-[#111111]">{post.title}</h3>
                      <p className="mb-4 text-sm leading-relaxed text-gray-600">{post.excerpt}</p>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-semibold text-gray-600">
                          {post.is_published ? 'Publicado' : 'Rascunho'}
                        </span>
                        <Link href={`/blog/${post.slug}`} className="rounded-full bg-[#111111] px-4 py-2 text-sm font-semibold text-white">
                          Ver página
                        </Link>
                        <button type="button" onClick={() => handleEdit(post)} className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-[#111111]">
                          Editar
                        </button>
                        {!post.id.startsWith('seed-') && (
                          <button type="button" onClick={() => void handleDelete(post)} disabled={deletingPostId === post.id} className="rounded-full border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 disabled:opacity-60">
                            {deletingPostId === post.id ? 'A remover...' : 'Remover'}
                          </button>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
