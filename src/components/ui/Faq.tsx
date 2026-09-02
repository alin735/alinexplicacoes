import type { ReactNode } from 'react';

export type Pergunta = {
  pergunta: string;
  resposta: ReactNode;
};

/**
 * As perguntas frequentes. Usa `<details>` do próprio browser em vez de estado
 * em React: abre sem JavaScript, o Ctrl+F do browser encontra o texto lá
 * dentro, e os motores de busca leem as respostas todas.
 */
export default function Faq({ perguntas }: { perguntas: Pergunta[] }) {
  return (
    <div className="grid gap-4">
      {perguntas.map((item) => (
        <details
          key={item.pergunta}
          className="group rounded-2xl border border-black/15 bg-white px-6 py-5 shadow-sm transition hover:shadow-md"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold text-[#111111]">
            {item.pergunta}
            <span
              aria-hidden
              className="flex-shrink-0 text-xl font-normal text-gray-400 transition-transform group-open:rotate-45"
            >
              +
            </span>
          </summary>
          <div className="mt-3 leading-relaxed text-gray-600">{item.resposta}</div>
        </details>
      ))}
    </div>
  );
}
