import type { Metadata } from 'next';
import { absoluteUrl } from '@/lib/site';
import { getPublishedBlogPosts } from '@/lib/blog-posts';
import HomeClient from './HomeClient';

// A homepage é interativa (componente cliente), por isso os metadados vivem
// aqui, neste invólucro de servidor. É o que garante o canonical próprio.
export const metadata: Metadata = {
  alternates: {
    canonical: absoluteUrl('/'),
  },
};

export default async function Page() {
  // Os artigos vêm daqui, do servidor: mostrar os últimos a sério vale mais
  // do que uma imitação desenhada, e não custa nada ao browser.
  const posts = await getPublishedBlogPosts();

  return (
    <HomeClient
      artigos={posts.slice(0, 3).map((post) => ({
        slug: post.slug,
        titulo: post.title,
        resumo: post.excerpt,
        categoria: post.category,
        tempoLeitura: post.read_time,
        imagem: post.cover_image_url,
        imagemAlt: post.cover_image_alt,
      }))}
    />
  );
}
