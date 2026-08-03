import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// ─── Portal do aluno ──────────────────────────────────────────────────────────
// O portal vive no mesmo Next.js mas é servido a partir do subdomínio
// `aluno.matematica.top`. Internamente, essas rotas são o segmento `/portal`.
// O middleware faz o rewrite por host: no subdomínio, `/x` → `/portal/x`; e no
// domínio principal o `/portal` fica escondido (redireciona para o subdomínio).
const PORTAL_HOST_PREFIX = 'aluno.';
const PORTAL_PATH_PREFIX = '/portal';
const PORTAL_ORIGIN = 'https://aluno.matematica.top';

export async function middleware(request: NextRequest) {
  const host = (request.headers.get('host') || '').toLowerCase();
  const pathname = request.nextUrl.pathname;
  const search = request.nextUrl.search;
  const isPortalHost = host.startsWith(PORTAL_HOST_PREFIX);
  const isDev = process.env.NODE_ENV !== 'production';

  // No domínio principal, o `/portal` não é acessível — em produção reencaminha
  // para o subdomínio. Em desenvolvimento deixamos passar (localhost sem subdomínio).
  if (!isPortalHost && pathname.startsWith(PORTAL_PATH_PREFIX) && !isDev) {
    const target = new URL((pathname.replace(PORTAL_PATH_PREFIX, '') || '/') + search, PORTAL_ORIGIN);
    return NextResponse.redirect(target);
  }

  // Só reescrevemos rotas de página. As APIs (`/api/...`) e os assets internos
  // (`/_next/...`) partilham o mesmo caminho nos dois hosts e passam intactos.
  const shouldRewrite =
    isPortalHost &&
    !pathname.startsWith(PORTAL_PATH_PREFIX) &&
    !pathname.startsWith('/api') &&
    !pathname.startsWith('/_next');
  const rewriteTarget = shouldRewrite
    ? new URL(`${PORTAL_PATH_PREFIX}${pathname === '/' ? '' : pathname}${search}`, request.url)
    : null;

  const makeResponse = () =>
    rewriteTarget
      ? NextResponse.rewrite(rewriteTarget, { request: { headers: request.headers } })
      : NextResponse.next({ request: { headers: request.headers } });

  let response = makeResponse();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key || url === 'your_supabase_url_here') {
    return response;
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: any) {
        request.cookies.set({ name, value, ...options });
        response = makeResponse();
        response.cookies.set({ name, value, ...options });
      },
      remove(name: string, options: any) {
        request.cookies.set({ name, value: '', ...options });
        response = makeResponse();
        response.cookies.set({ name, value: '', ...options });
      },
    },
  });

  // Mantém a sessão Supabase fresca (usada pelo portal e pelo resto do site).
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
