import type { ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Pill, { type TomPill } from './Pill';

/**
 * O cartão de destaque do site, tal como aparece em /correcoes: pílula em
 * cima, título, descrição a preencher o espaço, e a chamada colada em baixo
 * para que cartões lado a lado acabem alinhados mesmo com textos de tamanhos
 * diferentes.
 *
 * Com `href` é um cartão clicável inteiro; sem `href` é só uma caixa.
 */
export function HighlightCard({
  href,
  pilula,
  tomPilula = 'confirma',
  titulo,
  descricao,
  chamada,
  imagem,
  imagemAlt,
  ajusteImagem = 'conter',
}: {
  href?: string;
  pilula?: ReactNode;
  tomPilula?: TomPill;
  titulo: ReactNode;
  descricao?: ReactNode;
  /** Texto do link em baixo, ex.: "Ver correção". A seta é acrescentada aqui. */
  chamada?: string;
  imagem?: string;
  imagemAlt?: string;
  /**
   * As imagens do site são desenhos, e cortá-los tira-lhes o sentido (o
   * cartaz fica sem o texto). Por isso o normal é `conter`, que mostra o
   * desenho inteiro. `cobrir` fica para fotografias, onde encher a área é
   * mais importante do que ver as bordas.
   */
  ajusteImagem?: 'conter' | 'cobrir';
}) {
  const conteudo = (
    <>
      {imagem && (
        <div className="relative -m-6 mb-0 aspect-[4/3] overflow-hidden rounded-t-2xl bg-[#fafafa]">
          <Image
            src={imagem}
            alt={imagemAlt || ''}
            fill
            className={`transition-transform duration-500 group-hover:scale-[1.03] ${
              ajusteImagem === 'conter' ? 'object-contain p-4' : 'object-cover'
            }`}
          />
        </div>
      )}
      <div className={`flex-1 ${imagem ? 'pt-6' : ''}`}>
        {pilula && <Pill tom={tomPilula}>{pilula}</Pill>}
        <h3 className={`text-xl font-black text-[#000000] ${pilula ? 'mt-4' : ''}`}>{titulo}</h3>
        {descricao && <p className="mt-2 text-sm leading-relaxed text-gray-600">{descricao}</p>}
      </div>
      {chamada && (
        <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-black transition-all group-hover:gap-2.5">
          {chamada}
          <span aria-hidden>→</span>
        </span>
      )}
    </>
  );

  const classes =
    'group flex flex-col rounded-2xl border border-black/15 bg-white p-6 shadow-sm' +
    (href ? ' transition hover:-translate-y-0.5 hover:shadow-md' : '');

  // O bloco da descrição estica para a chamada assentar sempre no fundo.
  const corpo = <div className="flex flex-1 flex-col">{conteudo}</div>;

  return href ? (
    <Link href={href} className={classes}>
      {corpo}
    </Link>
  ) : (
    <div className={classes}>{corpo}</div>
  );
}

/** Caixa branca simples, para conteúdo que não é um destaque nem um link. */
export function Card({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-black/15 bg-white p-6 shadow-sm ${className}`}>
      {children}
    </div>
  );
}
