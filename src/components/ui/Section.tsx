import type { ReactNode } from 'react';
import { LARGURAS, type Largura } from './tokens';

/**
 * Uma faixa de conteúdo. Trata do espaçamento vertical, da largura útil e da
 * alternância de fundos, que antes cada página resolvia com números próprios.
 */
export default function Section({
  children,
  titulo,
  descricao,
  largura = 'total',
  /** `claro` é o cinzento das páginas; `branco` destaca a faixa do resto. */
  fundo = 'claro',
  /** Risca a separar da faixa seguinte. */
  separador = false,
  className = '',
}: {
  children: ReactNode;
  titulo?: ReactNode;
  descricao?: ReactNode;
  largura?: Largura;
  fundo?: 'claro' | 'branco' | 'nenhum';
  separador?: boolean;
  className?: string;
}) {
  const fundos = {
    claro: 'bg-[#f5f5f5]',
    branco: 'bg-white',
    nenhum: '',
  } as const;

  return (
    <section
      className={`px-4 py-14 ${fundos[fundo]} ${separador ? 'border-b border-black/15' : ''} ${className}`}
    >
      <div className={`mx-auto ${LARGURAS[largura]}`}>
        {titulo && (
          <h2 className="text-2xl font-black text-[#000000] sm:text-3xl">{titulo}</h2>
        )}
        {descricao && (
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-gray-700">{descricao}</p>
        )}
        <div className={titulo || descricao ? 'mt-8' : ''}>{children}</div>
      </div>
    </section>
  );
}
