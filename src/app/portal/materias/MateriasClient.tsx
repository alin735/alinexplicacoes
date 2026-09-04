'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

type Estado = 'bom' | 'medio' | 'mau';

type Tema = {
  id: string;
  nome: string;
  /** Detalhe em cinzento por baixo do nome. Não é marcável. */
  detalhe?: string;
};

type Grupo = {
  /** Título do bloco. Null quando os temas ficam soltos, como na escolha múltipla. */
  titulo: string | null;
  temas: Tema[];
};

type Parte = {
  parte: string;
  grupos: Grupo[];
};

/**
 * Matérias que podem sair no exame de Matemática A, na ordem em que o Alin as
 * organizou. Para acrescentar ou mudar um tema, é só editar esta constante.
 */
const ESTRUTURA: Parte[] = [
  {
    parte: 'Escolha múltipla',
    grupos: [
      {
        titulo: null,
        temas: [
          { id: 'em-estatistica', nome: 'Estatística' },
          { id: 'em-complexos', nome: 'Números complexos' },
          {
            id: 'em-geometria',
            nome: 'Geometria analítica',
            detalhe: 'eq. do plano, eq. da reta, coordenadas, declive e inclinação, produto escalar',
          },
        ],
      },
    ],
  },
  {
    parte: 'Escrita',
    grupos: [
      {
        titulo: 'Geometria analítica',
        temas: [
          { id: 'ge-geometria', nome: 'Geometria', detalhe: 'volumes, produto escalar, eq. do plano, eq. da reta' },
          { id: 'ge-trigonometria', nome: 'Trigonometria', detalhe: 'equações, círculo trigonométrico' },
        ],
      },
      {
        titulo: 'Sucessões',
        temas: [
          { id: 'su-recorrencia', nome: 'Recorrência' },
          { id: 'su-termogeral', nome: 'Termo geral' },
          { id: 'su-soma', nome: 'Soma dos n primeiros termos' },
          { id: 'su-monotonia', nome: 'Monotonia' },
          { id: 'su-limite-e', nome: 'Limite do e', detalhe: 'lim (1 + 1/n)ⁿ = e' },
        ],
      },
      {
        titulo: 'Funções',
        temas: [
          { id: 'fu-continuidade', nome: 'Continuidade' },
          { id: 'fu-monotonia', nome: 'Monotonia / concavidade' },
          { id: 'fu-assintotas', nome: 'Assíntotas' },
          { id: 'fu-bolzano', nome: 'Teorema de Bolzano' },
          { id: 'fu-calculadora', nome: 'Calculadora gráfica' },
          { id: 'fu-exp-log', nome: 'Exponenciais / logaritmos' },
          { id: 'fu-falsidade', nome: 'Justificar falsidade' },
          { id: 'fu-paridade', nome: 'Paridade' },
        ],
      },
      {
        titulo: 'Cálculo combinatório',
        temas: [
          { id: 'cc-combinatoria', nome: 'Combinatória', detalhe: 'fila, complementar, número' },
          { id: 'cc-pascal', nome: 'Triângulo de Pascal' },
          { id: 'cc-newton', nome: 'Binómio de Newton' },
        ],
      },
      {
        titulo: 'Probabilidades',
        temas: [
          { id: 'pr-condicionada', nome: 'Probabilidade condicionada' },
          { id: 'pr-combinatoria', nome: 'Probabilidade + combinatória' },
        ],
      },
      {
        titulo: 'Números complexos',
        temas: [
          { id: 'nc-alg-trig', nome: 'Forma algébrica → trigonométrica' },
          { id: 'nc-trig-alg', nome: 'Forma trigonométrica → algébrica' },
          { id: 'nc-operacoes', nome: 'Divisão, multiplicação, raízes, potências' },
        ],
      },
    ],
  },
];

const CHAVE = 'matematicatop-materias-exame-a';

const SIMBOLO: Record<Estado, string> = { bom: '+', medio: '±', mau: '−' };
const LEGENDA: Array<{ estado: Estado; texto: string }> = [
  { estado: 'bom', texto: 'já domino' },
  { estado: 'medio', texto: 'mais ou menos' },
  { estado: 'mau', texto: 'por trabalhar' },
];

const CHIP: Record<Estado, string> = {
  bom: 'bg-green-100 text-green-700',
  medio: 'bg-amber-100 text-amber-700',
  mau: 'bg-red-100 text-red-700',
};

const BOTAO_ATIVO: Record<Estado, string> = {
  bom: 'border-green-600 bg-green-100 text-green-700',
  medio: 'border-amber-600 bg-amber-100 text-amber-700',
  mau: 'border-red-600 bg-red-100 text-red-700',
};

const CARTAO_ATIVO: Record<Estado, string> = {
  bom: 'border-green-600',
  medio: 'border-amber-600',
  mau: 'border-red-600',
};

const TODOS_OS_TEMAS = ESTRUTURA.flatMap((p) => p.grupos.flatMap((g) => g.temas));

export default function MateriasClient() {
  const [marcas, setMarcas] = useState<Record<string, Estado>>({});
  // Só lemos o armazenamento depois de montar, senão o servidor e o cliente
  // renderizavam coisas diferentes.
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    try {
      const guardado = window.localStorage.getItem(CHAVE);
      if (guardado) setMarcas(JSON.parse(guardado) as Record<string, Estado>);
    } catch {
      // Browser sem armazenamento disponível: a página funciona na mesma, só não guarda.
    }
    setPronto(true);
  }, []);

  const alternar = useCallback((id: string, valor: Estado) => {
    setMarcas((atual) => {
      const seguinte = { ...atual };
      if (seguinte[id] === valor) delete seguinte[id];
      else seguinte[id] = valor;
      try {
        window.localStorage.setItem(CHAVE, JSON.stringify(seguinte));
      } catch {
        // Sem armazenamento, a marcação vale só para esta visita.
      }
      return seguinte;
    });
  }, []);

  const limpar = useCallback(() => {
    if (!window.confirm('Apagar todas as marcações e recomeçar?')) return;
    setMarcas({});
    try {
      window.localStorage.removeItem(CHAVE);
    } catch {
      // Nada a fazer.
    }
  }, []);

  const contagens = useMemo(() => {
    const total = TODOS_OS_TEMAS.length;
    let bons = 0;
    let medios = 0;
    let maus = 0;
    TODOS_OS_TEMAS.forEach((t) => {
      if (marcas[t.id] === 'bom') bons += 1;
      else if (marcas[t.id] === 'medio') medios += 1;
      else if (marcas[t.id] === 'mau') maus += 1;
    });
    return { total, bons, medios, maus, porMarcar: total - bons - medios - maus };
  }, [marcas]);

  const resumo = (() => {
    const partes: string[] = [];
    if (contagens.bons) partes.push(`${contagens.bons} dominados`);
    if (contagens.medios) partes.push(`${contagens.medios} mais ou menos`);
    if (contagens.maus) partes.push(`${contagens.maus} por trabalhar`);
    if (contagens.porMarcar) partes.push(`${contagens.porMarcar} por marcar`);
    return partes.join(' · ');
  })();

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-black text-[#111111]">Exame de Matemática A</h1>

      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 rounded-2xl border border-black/15 bg-white px-4 py-3 text-sm text-black/60">
        {LEGENDA.map(({ estado, texto }) => (
          <span key={estado} className="inline-flex items-center gap-2">
            <span
              className={`inline-flex h-6 w-6 items-center justify-center rounded-md text-sm font-bold ${CHIP[estado]}`}
            >
              {SIMBOLO[estado]}
            </span>
            {texto}
          </span>
        ))}
      </div>

      <div className="sticky top-[4.5rem] z-30 mt-4 rounded-2xl border border-black/15 bg-white px-4 py-3.5 shadow-sm">
        <div className="flex items-baseline justify-between gap-3">
          <strong className="text-[15px]">
            {contagens.bons} de {contagens.total} temas dominados
          </strong>
          <span className="text-xl font-black">
            {Math.round((contagens.bons / contagens.total) * 100)}%
          </span>
        </div>
        <div className="mt-2.5 flex h-2 overflow-hidden rounded-full bg-black/10">
          <span
            className="block h-full bg-green-600 transition-all"
            style={{ width: `${(contagens.bons / contagens.total) * 100}%` }}
          />
          <span
            className="block h-full bg-amber-500 transition-all"
            style={{ width: `${(contagens.medios / contagens.total) * 100}%` }}
          />
        </div>
        <p className="mt-2 text-[13px] text-black/50">
          {pronto && resumo ? resumo : 'Ainda não marcaste nada.'}
        </p>
      </div>

      {ESTRUTURA.map((parte) => (
        <section key={parte.parte}>
          <h2 className="mt-7 mb-2.5 text-xs font-bold uppercase tracking-wider text-black/45">
            {parte.parte}
          </h2>

          {parte.grupos.map((grupo) => (
            <div key={grupo.titulo ?? 'soltos'}>
              {grupo.titulo && (
                <h3 className="mt-4 mb-2 text-[15px] font-bold text-[#111111]">{grupo.titulo}</h3>
              )}

              <div className={grupo.titulo ? 'ml-3.5' : ''}>
                {grupo.temas.map((tema) => {
                  const estado = marcas[tema.id];
                  return (
                    <div
                      key={tema.id}
                      className={`mb-1.5 flex items-center gap-3 rounded-xl border bg-white px-3.5 py-2.5 ${
                        estado ? CARTAO_ATIVO[estado] : 'border-black/15'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-[14.5px] font-semibold text-[#111111]">{tema.nome}</p>
                        {tema.detalhe && (
                          <p className="mt-0.5 text-[12.5px] text-black/50">{tema.detalhe}</p>
                        )}
                      </div>

                      <div className="flex flex-shrink-0 gap-1.5">
                        {(['bom', 'medio', 'mau'] as Estado[]).map((v) => (
                          <button
                            key={v}
                            type="button"
                            onClick={() => alternar(tema.id, v)}
                            aria-label={`${tema.nome}: ${LEGENDA.find((l) => l.estado === v)?.texto}`}
                            aria-pressed={estado === v}
                            className={`h-9 w-9 rounded-lg border text-[15px] font-bold leading-none transition ${
                              estado === v
                                ? BOTAO_ATIVO[v]
                                : 'border-black/15 text-black/40 hover:border-black/35'
                            }`}
                          >
                            {SIMBOLO[v]}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </section>
      ))}

      <div className="mt-8 border-t border-black/15 pt-5">
        <button
          type="button"
          onClick={limpar}
          className="rounded-full border border-black/15 px-4 py-2 text-sm text-black/50 transition hover:border-black/35 hover:text-black"
        >
          Recomeçar do zero
        </button>
        <p className="mt-3 text-xs text-black/40">
          As tuas marcações ficam guardadas neste browser. Se abrires noutro dispositivo, começas do zero.
        </p>
      </div>
    </div>
  );
}
