import { mdInicio } from '@/lib/markdown';

// /llms.txt: o índice do site em Markdown, para modelos de linguagem.
export const revalidate = 3600;

export function GET() {
  return new Response(mdInicio(), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
}
