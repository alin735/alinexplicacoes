'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { thumbnailYoutube, urlYoutube, type Video } from '@/data/materias';

/**
 * Os vídeos de um tema: uma grelha de blocos pequenos (miniatura + título),
 * três por linha, e um leitor grande em cima que só existe depois de se
 * clicar num bloco. Assim a página abre leve (só imagens) e o vídeo escolhido
 * vê-se em tamanho decente, não no quadrado do bloco.
 */
export default function GaleriaVideos({ videos }: { videos: Video[] }) {
  const [ativo, setAtivo] = useState<Video | null>(null);
  const leitorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (ativo && leitorRef.current) {
      leitorRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [ativo]);

  return (
    <div>
      {ativo && (
        <div ref={leitorRef} className="mb-10 scroll-mt-28">
          <div className="aspect-video w-full overflow-hidden rounded-2xl border border-black/15 bg-black shadow-sm">
            <iframe
              key={ativo.id}
              src={`https://www.youtube-nocookie.com/embed/${ativo.id}?autoplay=1&rel=0`}
              title={ativo.titulo}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="h-full w-full"
            />
          </div>
          <div className="mt-3 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
            <h2 className="text-xl font-black text-[#000000] sm:text-2xl">{ativo.titulo}</h2>
            <a
              href={urlYoutube(ativo.id)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-[#6b7280] hover:text-black"
            >
              Ver no YouTube <span aria-hidden>↗</span>
            </a>
          </div>
        </div>
      )}

      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {videos.map((v, i) => {
          const selecionado = ativo?.id === v.id;
          return (
            <li key={v.id}>
              <button
                type="button"
                onClick={() => setAtivo(v)}
                aria-label={`Ver o vídeo: ${v.titulo}`}
                aria-current={selecionado ? 'true' : undefined}
                className={`group flex h-full w-full flex-col overflow-hidden rounded-2xl border bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                  selecionado ? 'border-black' : 'border-black/15'
                }`}
              >
                <span className="relative block aspect-video w-full bg-[#111111]">
                  <Image
                    src={thumbnailYoutube(v.id)}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 340px, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="flex h-11 w-16 items-center justify-center rounded-xl bg-[#111111]/90 text-white shadow-lg transition group-hover:bg-[#000000]">
                      <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
                        <path fill="currentColor" d="M8 5v14l11-7z" />
                      </svg>
                    </span>
                  </span>
                </span>
                <span className="flex items-start gap-2.5 p-4">
                  <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-black/10 text-xs font-bold text-[#111111]">
                    {i + 1}
                  </span>
                  <span className="text-sm font-bold leading-snug text-[#000000]">{v.titulo}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
