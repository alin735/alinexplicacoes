import type { ReactNode } from 'react';

/**
 * A pílula é o rótulo pequeno que aparece por cima dos títulos e dentro dos
 * cartões. Três tons, cada um com um trabalho:
 *
 *   destaque  âmbar   novidade, urgência, "em breve"
 *   confirma  verde   tranquilizar, datas já conhecidas, "é gratuito"
 *   neutro    cinza   informação seca, contadores, etiquetas de conteúdo
 */
export type TomPill = 'destaque' | 'confirma' | 'neutro';

const TONS: Record<TomPill, string> = {
  destaque: 'border-[#f59e0b]/40 bg-[#fff7ed] text-[#b45309]',
  confirma: 'border-[#16a34a]/30 bg-[#f0fdf4] text-[#15803d]',
  neutro: 'border-black/15 bg-[#f5f5f5] text-[#111111]',
};

export default function Pill({
  children,
  tom = 'destaque',
  /**
   * As pílulas que servem de sobretítulo vão em maiúsculas com as letras
   * afastadas. As que vivem dentro de cartões ficam em texto normal, senão
   * competem com o título do cartão.
   */
  sobretitulo = false,
  className = '',
}: {
  children: ReactNode;
  tom?: TomPill;
  sobretitulo?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-3.5 py-1.5 font-semibold ${
        TONS[tom]
      } ${sobretitulo ? 'text-xs uppercase tracking-[0.12em]' : 'text-[11px]'} ${className}`}
    >
      {children}
    </span>
  );
}
