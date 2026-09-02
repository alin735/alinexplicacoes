import type { ReactNode } from 'react';
import MathRain from '@/components/MathRain';
import Pill, { type TomPill } from './Pill';
import { LARGURAS, type Largura } from './tokens';

/**
 * O topo de todas as páginas do site.
 *
 * Fundo branco com os símbolos a cair, uma pílula opcional, o título e uma
 * frase. O `pt-32` existe porque a barra de navegação é fixa e tapa o topo:
 * qualquer página que monte o seu próprio herói tem de repetir esse espaço, e
 * era aí que as páginas iam divergindo umas das outras.
 */
export default function PageHero({
  titulo,
  descricao,
  pilula,
  tomPilula = 'destaque',
  largura = 'estreita',
  children,
}: {
  titulo: ReactNode;
  descricao?: ReactNode;
  pilula?: ReactNode;
  tomPilula?: TomPill;
  largura?: Largura;
  /** Espaço para chips, botões ou um formulário logo abaixo da frase. */
  children?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden border-b border-black/15 bg-white px-4 pb-12 pt-32">
      <MathRain speed="fast" />
      <div className={`relative z-10 mx-auto text-center ${LARGURAS[largura]}`}>
        {pilula && (
          <Pill tom={tomPilula} sobretitulo className="mb-4">
            {pilula}
          </Pill>
        )}
        <h1 className="mb-3 text-4xl font-black text-[#000000] sm:text-5xl">{titulo}</h1>
        {descricao && (
          <p className="mx-auto max-w-2xl text-base text-gray-700 sm:text-lg">{descricao}</p>
        )}
        {children}
      </div>
    </section>
  );
}
