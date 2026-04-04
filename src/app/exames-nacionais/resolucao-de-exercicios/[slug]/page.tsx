import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import RichTextContent from '@/components/RichTextContent';
import TikTokEmbed from '@/components/TikTokEmbed';
import { buildTikTokEmbedHtml } from '@/lib/exam-exercises';
import { getExamExerciseBySlug } from '@/lib/exam-exercise-posts';
import { absoluteUrl } from '@/lib/site';

type ExerciseDetailPageProps = {
  params: { slug: string };
};

export async function generateMetadata({ params }: ExerciseDetailPageProps): Promise<Metadata> {
  const { slug } = params;
  const post = await getExamExerciseBySlug(slug);

  if (!post) {
    return {
      title: 'Exercício não encontrado',
    };
  }

  return {
    title: post.title,
    description: post.seo_description,
    alternates: {
      canonical: absoluteUrl(`/exames-nacionais/resolucao-de-exercicios/${post.slug}`),
    },
    openGraph: {
      title: `${post.title} | MatemáticaTop`,
      description: post.seo_description,
      url: absoluteUrl(`/exames-nacionais/resolucao-de-exercicios/${post.slug}`),
    },
  };
}

export default async function ExerciseDetailPage({ params }: ExerciseDetailPageProps) {
  const { slug } = params;
  const post = await getExamExerciseBySlug(slug);

  if (!post) {
    notFound();
  }

  const tiktokEmbedHtml =
    post.media_type === 'tiktok'
      ? post.tiktok_embed_html || (post.tiktok_url ? buildTikTokEmbedHtml(post.tiktok_url) : null)
      : null;

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#f4f7fb] pt-28">
        <div className="max-w-5xl mx-auto px-4 pb-16">
          <Link
            href="/exames-nacionais/resolucao-de-exercicios"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#3f6c93] hover:text-[#294a67]"
          >
            ← Voltar à resolução de exercícios
          </Link>

          <section className="mt-6 overflow-hidden rounded-[2.25rem] border border-black/10 bg-white shadow-[0_24px_60px_rgba(0,0,0,0.08)]">
            <div className="relative aspect-[16/8] bg-[#d7e6f3]">
              <Image
                src={post.thumbnail_url || '/images/exames/resolucao-de-exercicios.png'}
                alt={post.title}
                fill
                className="object-cover"
              />
            </div>

            <div className="p-6 sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#3f6c93] mb-4">
                {post.school_year} · {post.broad_theme} · {post.subtheme}
              </p>
              <h1 className="text-4xl sm:text-5xl font-black text-[#000000] mb-2">{post.title}</h1>
              <p className="text-base leading-relaxed text-gray-600">{post.summary}</p>
            </div>
          </section>

          <section className="mt-6">
            {post.media_type === 'tiktok' && tiktokEmbedHtml ? (
              <TikTokEmbed embedHtml={tiktokEmbedHtml} />
            ) : post.video_url ? (
              <div className="overflow-hidden rounded-[1.75rem] border border-black/10 bg-white p-4 shadow-[0_24px_60px_rgba(0,0,0,0.08)]">
                <video controls preload="metadata" className="w-full rounded-[1.25rem]" src={post.video_url} />
              </div>
            ) : null}
          </section>

          <section className="mt-6 rounded-[2rem] border border-black/10 bg-white p-6 sm:p-8 shadow-[0_24px_60px_rgba(0,0,0,0.08)]">
            <h2 className="text-2xl font-black text-[#111111] mb-4">Explicação do exercício</h2>
            <RichTextContent content={post.seo_description} />
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
