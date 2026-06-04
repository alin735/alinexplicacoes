'use client';

import Image from 'next/image';
import { useState } from 'react';

type ResumoRevealProps = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

export default function ResumoReveal({ src, alt, width, height }: ResumoRevealProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (isOpen) {
    return (
      <figure className="mx-auto w-full max-w-[440px] overflow-hidden rounded-[1.5rem] border border-black/10 bg-white shadow-[0_12px_30px_rgba(0,0,0,0.06)]">
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          className="h-auto w-full object-contain"
        />
        {alt ? (
          <figcaption className="px-4 py-3 text-center text-xs font-medium text-gray-500">{alt}</figcaption>
        ) : null}
      </figure>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[440px] overflow-hidden rounded-[1.5rem] border border-black/10 bg-[#111111] text-white shadow-[0_12px_30px_rgba(0,0,0,0.12)]">
      <div className="flex flex-col items-start p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">Resumo</p>
        <p className="mt-2 text-lg font-black leading-tight">Resumo do artigo numa imagem</p>
        <p className="mt-2 text-sm text-white/80">Guarda este resumo: clica para o veres e tira print.</p>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="mt-5 inline-flex items-center justify-center rounded-xl bg-white px-4 py-2 text-sm font-semibold text-[#111111] transition hover:bg-white/90"
        >
          Ver resumo
        </button>
      </div>
    </div>
  );
}
