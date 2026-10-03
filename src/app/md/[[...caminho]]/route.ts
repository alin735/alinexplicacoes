import { markdownDe } from '@/lib/markdown';

// Versão em Markdown de uma página pública. Não é para ser visitada
// diretamente: o middleware encaminha para aqui os pedidos com
// `Accept: text/markdown` (agentes de IA), mantendo o endereço original.
export async function GET(_req: Request, { params }: { params: { caminho?: string[] } }) {
  const caminho = '/' + (params.caminho ?? []).join('/');
  const md = await markdownDe(caminho);
  if (!md) {
    return new Response('# Página sem versão em Markdown\n\nVê o índice do site em /llms.txt\n', {
      status: 404,
      headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
    });
  }
  return new Response(md, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'X-Robots-Tag': 'noindex',
      Vary: 'Accept',
      // Aproximação da norma "Markdown for Agents": ~4 caracteres por token.
      'x-markdown-tokens': String(Math.ceil(md.length / 4)),
    },
  });
}
