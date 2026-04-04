'use client';

import Script from 'next/script';

type TikTokEmbedProps = {
  embedHtml: string;
};

export default function TikTokEmbed({ embedHtml }: TikTokEmbedProps) {
  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-black/10 bg-white p-4 shadow-[0_24px_60px_rgba(0,0,0,0.08)]">
      <div dangerouslySetInnerHTML={{ __html: embedHtml }} />
      <Script src="https://www.tiktok.com/embed.js" strategy="lazyOnload" />
    </div>
  );
}
