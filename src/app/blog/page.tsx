import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import { PageHero, Section } from '@/components/ui';
import { getPublishedBlogPosts } from '@/lib/blog-posts';
import { absoluteUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Blog',
  description:
    'Artigos sobre Exame Nacional, Matemática A e métodos de estudo.',
  alternates: {
    canonical: absoluteUrl('/blog'),
  },
  openGraph: {
    title: 'Blog | MatemáticaTop',
    description: 'Artigos sobre Exame Nacional, Matemática A e métodos de estudo.',
    url: absoluteUrl('/blog'),
  },
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat('pt-PT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date));
}

export default async function BlogPage() {
  const posts = await getPublishedBlogPosts();

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#f5f5f5]">
        <PageHero
          titulo="Blog"
          descricao="Artigos com ideias, estratégias e informação útil para quem está a estudar Matemática."
        />

        <Section largura="larga">
          <div className="grid gap-6 md:grid-cols-2">
            {posts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-black/15 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="relative aspect-[16/9] overflow-hidden bg-[#fafafa]">
                  <Image
                    src={post.cover_image_url}
                    alt={post.cover_image_alt}
                    fill
                    className="object-contain p-4 transition-transform duration-500 group-hover:scale-[1.02]"
                  />
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#6b7280]">
                    <span>{post.category}</span>
                    <span aria-hidden>·</span>
                    <span>{formatDate(post.published_at || post.created_at)}</span>
                    <span aria-hidden>·</span>
                    <span>{post.read_time}</span>
                  </div>
                  <h2 className="mb-3 text-xl font-black text-[#000000]">{post.title}</h2>
                  <p className="flex-1 text-sm leading-relaxed text-gray-600">{post.excerpt}</p>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-black transition-all group-hover:gap-2.5">
                    Ler o artigo
                    <span aria-hidden>→</span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </Section>
      </main>
      <Footer />
    </>
  );
}
