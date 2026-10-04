import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import RichTextContent from '@/components/RichTextContent';
import { getBlogPostBySlug, getPublishedBlogPosts } from '@/lib/blog-posts';
import { absoluteUrl } from '@/lib/site';

type BlogPostPageProps = {
  params: Promise<{ slug: string }>;
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat('pt-PT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date));
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    return { title: 'Artigo não encontrado' };
  }

  return {
    title: post.title,
    description: post.seo_description,
    alternates: {
      canonical: absoluteUrl(`/blog/${post.slug}`),
    },
    openGraph: {
      title: `${post.title} | MatemáticaTop`,
      description: post.seo_description,
      url: absoluteUrl(`/blog/${post.slug}`),
      images: [
        {
          url: post.cover_image_url,
          alt: post.cover_image_alt,
        },
      ],
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const relatedPosts = (await getPublishedBlogPosts())
    .filter((entry) => entry.slug !== post.slug)
    .slice(0, 2);

  const publishedAt = post.published_at || post.created_at;
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.seo_description,
    datePublished: publishedAt,
    dateModified: post.updated_at || publishedAt,
    image: absoluteUrl(post.cover_image_url),
    author: {
      '@type': 'Person',
      name: 'Alin',
    },
    publisher: {
      '@type': 'Organization',
      name: 'MatemáticaTop',
      logo: {
        '@type': 'ImageObject',
        url: absoluteUrl('/logo.png'),
      },
    },
    mainEntityOfPage: absoluteUrl(`/blog/${post.slug}`),
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#f5f5f5] pt-28">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />

        <div className="mx-auto max-w-5xl px-4 pb-16">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#111111] hover:text-[#000000]"
          >
            ← Voltar ao blog
          </Link>

          <article className="mt-6 overflow-hidden rounded-2xl border border-black/15 bg-white shadow-sm">
            <div className="relative aspect-[16/8] bg-[#f7f7f7]">
              <Image
                src={post.cover_image_url}
                alt={post.cover_image_alt}
                fill
                className="object-contain"
              />
            </div>

            <div className="p-6 sm:p-8">
              <div className="mb-4 flex flex-wrap items-center gap-3 text-xs font-semibold text-[#6b7280]">
                <span>{post.category}</span>
                <span>{formatDate(publishedAt)}</span>
                <span>{post.read_time}</span>
              </div>
              <h1 className="mb-3 text-4xl font-black text-[#000000] sm:text-5xl">{post.title}</h1>
              <p className="text-base leading-relaxed text-gray-600">{post.excerpt}</p>
            </div>
          </article>

          <section className="mt-6 rounded-2xl border border-black/15 bg-white p-6 sm:p-8 shadow-sm">
            <RichTextContent content={post.content} className="space-y-6 text-base leading-relaxed text-gray-700" />
          </section>

          {(() => {
            // Liga o artigo à matéria: os do 9.º ano ao 9.º, os de Matemática A ao secundário.
            const texto = `${post.slug} ${post.title}`.toLowerCase();
            const e9 = /9.?º? ?ano|9ano|9-ano|prova final/.test(texto);
            const link = e9
              ? { href: '/matematica/9ano', nome: 'a matéria do 9.º ano' }
              : { href: '/matematica', nome: 'a matéria de Matemática A' };
            return (
              <Link
                href={link.href}
                className="mt-6 flex flex-col gap-1 rounded-2xl border border-black/15 bg-[#111111] p-6 text-white transition hover:-translate-y-0.5 sm:flex-row sm:items-center sm:justify-between sm:p-8"
              >
                <span className="text-xl font-black">Vê {link.nome} em vídeo</span>
                <span className="text-sm font-semibold text-white/70">
                  Tema a tema, e os exames resolvidos <span aria-hidden>→</span>
                </span>
              </Link>
            );
          })()}

          {relatedPosts.length > 0 && (
            <section className="mt-6 rounded-2xl border border-black/15 bg-white p-6 sm:p-8 shadow-sm">
              <h2 className="mb-5 text-2xl font-black text-[#111111]">Mais artigos</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {relatedPosts.map((entry) => (
                  <Link
                    key={entry.slug}
                    href={`/blog/${entry.slug}`}
                    className="rounded-2xl border border-black/15 bg-[#fafafa] p-5 transition-all hover:-translate-y-1 hover:bg-white"
                  >
                    <p className="mb-2 text-xs font-semibold text-[#6b7280]">
                      {entry.category}
                    </p>
                    <h3 className="mb-2 text-xl font-black text-[#111111]">{entry.title}</h3>
                    <p className="text-sm leading-relaxed text-gray-600">{entry.excerpt}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
