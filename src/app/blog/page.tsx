import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import Footer from '@/components/Footer';
import MathRain from '@/components/MathRain';
import Navbar from '@/components/Navbar';
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
        <section className="relative overflow-hidden border-b border-black/15 bg-white px-4 pb-12 pt-32">
          <MathRain speed="fast" />
          <div className="relative z-10 mx-auto max-w-6xl text-center">
            <h1 className="mb-2 text-4xl font-black text-[#000000] sm:text-5xl">Blog</h1>
            <p className="mx-auto max-w-2xl text-gray-600">
              Artigos com ideias, estratégias e informação útil para quem está a estudar Matemática A.
            </p>
          </div>
        </section>

        <section className="px-4 py-14">
          <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2">
            {posts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group overflow-hidden rounded-[2.25rem] border border-black/10 bg-white shadow-[0_24px_60px_rgba(0,0,0,0.08)] transition-all hover:-translate-y-1.5 hover:shadow-[0_30px_75px_rgba(17,17,17,0.12)]"
              >
                <div className="relative aspect-[16/9] overflow-hidden bg-[#f7f7f7]">
                  <Image
                    src={post.cover_image_url}
                    alt={post.cover_image_alt}
                    fill
                    className="object-contain transition-transform duration-500 group-hover:scale-[1.02]"
                  />
                </div>
                <div className="p-6">
                  <div className="mb-3 flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#5b7da3]">
                    <span>{post.category}</span>
                    <span>{formatDate(post.published_at || post.created_at)}</span>
                    <span>{post.read_time}</span>
                  </div>
                  <h2 className="mb-3 text-2xl font-black text-[#111111]">{post.title}</h2>
                  <p className="text-sm leading-relaxed text-gray-600">{post.excerpt}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
