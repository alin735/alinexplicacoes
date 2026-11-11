import { NextResponse, type NextRequest } from 'next/server';

/**
 * Proteção dos formulários públicos contra bots, sem nada a mais para o aluno:
 *
 * 1. Campo-armadilha: um campo escondido (`hp`) que as pessoas não veem e os
 *    bots preenchem. Se vier preenchido, é bot.
 * 2. Tempo mínimo: o formulário manda quantos milissegundos passaram desde que
 *    apareceu (`tempoMs`). Ninguém escreve nome e email em menos de 3 s.
 *    O tempo é medido só no browser, para não depender do relógio do servidor.
 * 3. Limite por IP: no máximo N envios por janela de tempo, por rota.
 *
 * Aos bots apanhados em 1 ou 2 responde-se como se tivesse corrido bem, sem
 * guardar nada nem enviar emails. Assim não percebem que foram travados.
 *
 * Nota: o limite por IP vive na memória de cada instância do servidor. Na
 * Vercel trava rajadas, mas não é uma contagem global exata.
 */

export const TEMPO_MINIMO_MS = 3000;

type Opcoes = {
  /** Nome da rota, para o limite por IP e para os registos. */
  rota: string;
  /**
   * Se `false`, um pedido sem `tempoMs` passa (só é travado se vier com um
   * tempo curto). Serve para rotas também usadas por servidores nossos, como o
   * bot do Discord, que não têm formulário.
   */
  exigirTempo?: boolean;
  maxPorJanela?: number;
  janelaMs?: number;
};

const enviosPorChave = new Map<string, number[]>();

function ipDoPedido(req: NextRequest) {
  const encaminhado = req.headers.get('x-forwarded-for');
  if (encaminhado) return encaminhado.split(',')[0].trim();
  return req.headers.get('x-real-ip')?.trim() || 'desconhecido';
}

function excedeuLimite(chave: string, maxPorJanela: number, janelaMs: number) {
  const agora = Date.now();
  const recentes = (enviosPorChave.get(chave) || []).filter((t) => agora - t < janelaMs);

  if (recentes.length >= maxPorJanela) {
    enviosPorChave.set(chave, recentes);
    return true;
  }

  recentes.push(agora);
  enviosPorChave.set(chave, recentes);

  // Arruma de vez em quando as chaves antigas, para o mapa não crescer sem fim.
  if (enviosPorChave.size > 5000) {
    enviosPorChave.forEach((tempos, k) => {
      if (!tempos.some((t) => agora - t < janelaMs)) enviosPorChave.delete(k);
    });
  }
  return false;
}

/**
 * Devolve `null` se o pedido pode seguir. Caso contrário, devolve já a
 * resposta a dar (sucesso falso para bots, 429 para quem excede o limite).
 */
export function travarBots(
  req: NextRequest,
  body: Record<string, unknown>,
  { rota, exigirTempo = true, maxPorJanela = 8, janelaMs = 10 * 60 * 1000 }: Opcoes,
): NextResponse | null {
  const ip = ipDoPedido(req);
  const armadilha = typeof body.hp === 'string' ? body.hp.trim() : '';
  const tempoMs = typeof body.tempoMs === 'number' && Number.isFinite(body.tempoMs) ? body.tempoMs : null;

  let motivo: string | null = null;
  if (armadilha) motivo = 'campo-armadilha preenchido';
  else if (tempoMs === null && exigirTempo) motivo = 'sem tempo de preenchimento';
  else if (tempoMs !== null && tempoMs < TEMPO_MINIMO_MS) motivo = `preenchido em ${Math.round(tempoMs)} ms`;

  if (motivo) {
    console.warn(`[anti-bot] ${rota}: travado (${motivo}), IP ${ip}`);
    return NextResponse.json({ success: true, warning: null });
  }

  if (excedeuLimite(`${rota}|${ip}`, maxPorJanela, janelaMs)) {
    console.warn(`[anti-bot] ${rota}: limite por IP excedido, IP ${ip}`);
    return NextResponse.json(
      { error: 'Muitos envios seguidos a partir desta rede. Tenta outra vez daqui a uns minutos.' },
      { status: 429 },
    );
  }

  return null;
}
