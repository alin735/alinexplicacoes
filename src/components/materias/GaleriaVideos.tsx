'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { duracaoLegivel, thumbnailYoutube, urlYoutube, type Video } from '@/data/materias';

export type GrupoVideos = { titulo: string; videos: Video[] };

/**
 * Os vídeos de um tema:
 *  - em cima, centrado, o leitor (de início com o vídeo de toda a matéria;
 *    se não houver, com o primeiro vídeo);
 *  - por baixo, uma coluna por grupo (Toda a matéria, Por tópico,
 *    Exercícios resolvidos), separadas por um traço fino, só com miniaturas.
 *
 * Nada carrega o leitor do YouTube antes de um clique: até lá são só
 * miniaturas, o que mantém a página leve. Clicar numa miniatura põe esse
 * vídeo no leitor e sobe até ele.
 */
export default function GaleriaVideos({
  completo,
  grupos,
  tituloCompleto,
}: {
  completo?: Video;
  grupos: GrupoVideos[];
  /** Título por baixo do leitor enquanto lá está o vídeo de toda a matéria. */
  tituloCompleto?: string;
}) {
  const outros = grupos.filter((g) => g.videos.length > 0);
  const primeiro = completo ?? outros[0]?.videos[0];

  const [ativo, setAtivo] = useState<Video | undefined>(primeiro);
  const [aTocar, setATocar] = useState(false);
  const palcoRef = useRef<HTMLDivElement | null>(null);

  if (!ativo) return null;

  // O vídeo de toda a matéria só aparece em baixo quando não está no leitor,
  // para se poder voltar a ele; enquanto está a tocar, seria repetido.
  const colunas: (GrupoVideos & { grande?: boolean })[] = [
    ...(completo && ativo.id !== completo.id ? [{ titulo: 'Toda a matéria', videos: [completo], grande: true }] : []),
    ...outros,
  ];

  const escolher = (v: Video) => {
    setAtivo(v);
    setATocar(true);
    palcoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const eCompleto = completo && ativo.id === completo.id;

  const larguraGrelha = { 1: 'lg:grid-cols-1', 2: 'lg:grid-cols-2', 3: 'lg:grid-cols-3' }[
    Math.min(colunas.length, 3) as 1 | 2 | 3
  ];

  return (
    <div>
      {/* Leitor */}
      <section ref={palcoRef} className="mx-auto max-w-4xl scroll-mt-28" aria-label="Vídeo">
        {aTocar ? (
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
        ) : (
          <button
            type="button"
            onClick={() => setATocar(true)}
            aria-label={`Ver o vídeo: ${ativo.titulo}`}
            className="group relative block aspect-video w-full overflow-hidden rounded-2xl border border-black/15 bg-[#111111] shadow-sm"
          >
            <Image
              src={thumbnailYoutube(ativo)}
              alt={ativo.titulo}
              fill
              priority
              sizes="(min-width: 1024px) 1280px, 100vw"
              quality={90}
              className="object-cover transition-transform duration-500 group-hover:scale-[1.01]"
            />
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="flex h-16 w-24 items-center justify-center rounded-2xl bg-[#111111]/90 text-white shadow-lg transition group-hover:bg-[#000000]">
                <svg viewBox="0 0 24 24" className="h-9 w-9" aria-hidden>
                  <path fill="currentColor" d="M8 5v14l11-7z" />
                </svg>
              </span>
            </span>
            {ativo.duracao && (
              <span className="absolute bottom-3 right-3 rounded-md bg-black/80 px-2 py-0.5 text-sm font-semibold text-white">
                {duracaoLegivel(ativo.duracao)}
              </span>
            )}
          </button>
        )}
        <div className="mt-3 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
          <h2 className="text-xl font-black text-[#000000] sm:text-2xl">
            {eCompleto && tituloCompleto ? tituloCompleto : ativo.titulo}
          </h2>
          <a
            href={urlYoutube(ativo.id)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-[#6b7280] hover:text-black"
          >
            Ver no YouTube <span aria-hidden>↗</span>
          </a>
        </div>
      </section>

      {/* Colunas */}
      <div
        className={`mt-12 grid gap-8 divide-y divide-black/15 lg:gap-0 lg:divide-x lg:divide-y-0 ${larguraGrelha} ${
          colunas.length === 1 ? 'mx-auto max-w-4xl' : ''
        }`}
      >
        {colunas.map((col) => (
          <section key={col.titulo} className="pt-8 first:pt-0 lg:px-6 lg:pt-0 lg:first:pl-0 lg:last:pr-0">
            <h2 className="mb-4 text-lg font-black text-[#000000]">{col.titulo}</h2>
            <ul className={col.grande ? '' : 'grid grid-cols-3 gap-x-2.5 gap-y-4'}>
              {col.videos.map((v) => (
                <li key={v.id}>
                  <Miniatura video={v} grande={col.grande} selecionado={ativo.id === v.id} onEscolher={escolher} />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

function Miniatura({
  video,
  grande,
  selecionado,
  onEscolher,
}: {
  video: Video;
  grande?: boolean;
  selecionado: boolean;
  onEscolher: (v: Video) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onEscolher(video)}
      aria-current={selecionado ? 'true' : undefined}
      className="group block w-full text-left"
    >
      <span
        className={`relative block aspect-video w-full overflow-hidden bg-[#111111] transition group-hover:-translate-y-0.5 group-hover:shadow-md ${
          grande ? 'rounded-xl' : 'rounded-lg'
        } ${selecionado ? 'ring-2 ring-black ring-offset-2 ring-offset-[#f5f5f5]' : 'shadow-sm'}`}
      >
        <Image
          src={thumbnailYoutube(video)}
          alt={video.titulo}
          fill
          // As miniaturas têm texto pequeno: pede-se ao Next uma imagem bem maior do
          // que o espaço ocupado, para ficar nítida em ecrãs de alta densidade.
          sizes={grande ? '(min-width: 1024px) 640px, 100vw' : '(min-width: 1024px) 384px, 50vw'}
          quality={90}
          className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
        {video.duracao && (
          <span
            className={`absolute rounded bg-black/80 font-semibold text-white ${
              grande ? 'bottom-2 right-2 px-1.5 py-0.5 text-xs' : 'bottom-1 right-1 px-1 text-[10px]'
            }`}
          >
            {duracaoLegivel(video.duracao)}
          </span>
        )}
      </span>
      <span
        aria-hidden
        className={`mt-1.5 block leading-snug text-gray-700 group-hover:text-black ${
          grande ? 'text-sm font-semibold' : 'text-[11px] font-medium'
        }`}
      >
        {video.titulo}
      </span>
    </button>
  );
}
