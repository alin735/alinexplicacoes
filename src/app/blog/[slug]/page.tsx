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
      <main className="min-h-screen bg-[#f4f7fb] pt-28">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />

        <div className="mx-auto max-w-5xl px-4 pb-16">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#3f6c93] hover:text-[#294a67]"
          >
            ← Voltar ao blog
          </Link>

          <article className="mt-6 overflow-hidden rounded-[2.25rem] border border-black/10 bg-white shadow-[0_24px_60px_rgba(0,0,0,0.08)]">
            <div className="relative aspect-[16/8] bg-[#f7f7f7]">
              <Image
                src={post.cover_image_url}
                alt={post.cover_image_alt}
                fill
                className="object-contain"
              />
            </div>

            <div className="p-6 sm:p-8">
              <div className="mb-4 flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#5b7da3]">
                <span>{post.category}</span>
                <span>{formatDate(publishedAt)}</span>
                <span>{post.read_time}</span>
              </div>
              <h1 className="mb-3 text-4xl font-black text-[#000000] sm:text-5xl">{post.title}</h1>
              <p className="text-base leading-relaxed text-gray-600">{post.excerpt}</p>
            </div>
          </article>

          <section className="mt-6 rounded-[2rem] border border-black/10 bg-white p-6 sm:p-8 shadow-[0_24px_60px_rgba(0,0,0,0.08)]">
            <RichTextContent content={post.content} className="space-y-6 text-base leading-relaxed text-gray-700" />
          </section>

          {relatedPosts.length > 0 && (
            <section className="mt-6 rounded-[2rem] border border-black/10 bg-white p-6 sm:p-8 shadow-[0_24px_60px_rgba(0,0,0,0.08)]">
              <h2 className="mb-5 text-2xl font-black text-[#111111]">Mais artigos</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {relatedPosts.map((entry) => (
                  <Link
                    key={entry.slug}
                    href={`/blog/${entry.slug}`}
                    className="rounded-[1.5rem] border border-black/10 bg-[#fafafa] p-5 transition-all hover:-translate-y-1 hover:bg-white"
                  >
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#5b7da3]">
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
