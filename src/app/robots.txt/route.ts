import { absoluteUrl } from '@/lib/site';

// O robots.txt é escrito à mão (em vez de app/robots.ts) para poder levar a
// linha Content-Signal, que o formato do Next ainda não suporta. Diz aos
// sistemas de IA que o conteúdo pode aparecer em pesquisas, ser usado para
// responder a perguntas (ai-input) e para treino (ai-train).
// Ver https://contentsignals.org
export function GET() {
  const corpo = `User-Agent: *
Content-Signal: search=yes, ai-input=yes, ai-train=yes
Allow: /
Disallow: /admin
Disallow: /conta
Disallow: /login
Disallow: /api/
Disallow: /md/

Sitemap: ${absoluteUrl('/sitemap.xml')}
`;
  return new Response(corpo, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
