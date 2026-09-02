'use client';

import Script from 'next/script';

type TikTokEmbedProps = {
  embedHtml: string;
};

export default function TikTokEmbed({ embedHtml }: TikTokEmbedProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-black/15 bg-white p-4 shadow-sm">
      <div dangerouslySetInnerHTML={{ __html: embedHtml }} />
      <Script src="https://www.tiktok.com/embed.js" strategy="lazyOnload" />
    </div>
  );
}
