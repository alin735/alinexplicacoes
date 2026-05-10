'use client';

import { useState } from 'react';

type TikTokEmbedPreviewProps = {
  embedUrl: string;
  videoUrl: string;
};

export default function TikTokEmbedPreview({ embedUrl, videoUrl }: TikTokEmbedPreviewProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  if (isLoaded) {
    return (
      <div className="mx-auto w-full max-w-[380px] overflow-hidden rounded-[1.5rem] border border-black/10 bg-white shadow-[0_12px_30px_rgba(0,0,0,0.06)]">
        <div className="relative aspect-[9/16]">
          <iframe
            src={embedUrl}
            title="Vídeo do TikTok"
            className="absolute inset-0 h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[380px] overflow-hidden rounded-[1.5rem] border border-black/10 bg-[#111111] text-white shadow-[0_12px_30px_rgba(0,0,0,0.12)]">
      <div className="relative aspect-[9/16]">
        <div className="absolute inset-0 flex flex-col justify-end p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">TikTok</p>
          <p className="mt-2 text-lg font-black leading-tight">Ver explicação em vídeo</p>
          <p className="mt-2 text-sm text-white/80">Clica para carregar o vídeo sem pesar a página ao abrir.</p>
          <button
            type="button"
            onClick={() => setIsLoaded(true)}
            className="mt-5 inline-flex items-center justify-center rounded-xl bg-white px-4 py-2 text-sm font-semibold text-[#111111] transition hover:bg-white/90"
          >
            Carregar vídeo
          </button>
          <a
            href={videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 text-xs font-semibold text-white/80 underline underline-offset-2 hover:text-white"
          >
            Abrir diretamente no TikTok
          </a>
        </div>
      </div>
    </div>
  );
}
