'use client';

import { useEffect, useRef, type RefObject } from 'react';

/**
 * Lado do browser da proteção contra bots (ver `src/lib/anti-bot.ts`).
 *
 * `useAntiBot(ativo)` começa a contar o tempo quando o formulário aparece (ou
 * quando `ativo` passa a `true`, no caso de um modal). `campos()` devolve o que
 * se junta ao corpo do pedido: `{ hp, tempoMs }`.
 */
export function useAntiBot(ativo = true) {
  const inicio = useRef(0);
  const armadilha = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ativo) inicio.current = Date.now();
  }, [ativo]);

  const campos = () => ({
    hp: armadilha.current?.value ?? '',
    tempoMs: inicio.current ? Date.now() - inicio.current : 0,
  });

  return { armadilha, campos };
}

/** Campo escondido que as pessoas não veem nem alcançam com o Tab. */
export function CampoArmadilha({ inputRef }: { inputRef: RefObject<HTMLInputElement | null> }) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        width: 1,
        height: 1,
        overflow: 'hidden',
        clipPath: 'inset(50%)',
        whiteSpace: 'nowrap',
        opacity: 0,
        pointerEvents: 'none',
      }}
    >
      <label>
        Não preenchas este campo
        <input ref={inputRef} type="text" name="hp_contacto" tabIndex={-1} autoComplete="off" defaultValue="" />
      </label>
    </div>
  );
}
