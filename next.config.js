/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Cabeçalhos para agentes de IA: a home aponta para o índice em Markdown
  // (/llms.txt) e para o sitemap, e as páginas de conteúdo avisam as caches de
  // que a resposta muda com o Accept (HTML para browsers, Markdown para agentes).
  async headers() {
    const vary = { key: 'Vary', value: 'Accept' };
    return [
      {
        source: '/',
        headers: [
          vary,
          {
            key: 'Link',
            value:
              '</llms.txt>; rel="describedby"; type="text/markdown", </sitemap.xml>; rel="sitemap"; type="application/xml", </>; rel="alternate"; type="text/markdown"',
          },
        ],
      },
      { source: '/matematica/:path*', headers: [vary] },
      { source: '/blog/:path*', headers: [vary] },
    ];
  },
  async redirects() {
    return [
      {
        source: '/blog/correcao-da-prova-ensaio-9ano',
        destination: '/matematica/exames',
        permanent: true,
      },
      // Páginas retiradas na reformulação. Os endereços antigos continuam a
      // andar por links, mensagens e resultados de pesquisa, por isso apontam
      // para o sítio que hoje faz o trabalho delas em vez de darem erro.
      // As Explicações Top foram abandonadas: a página da lista de espera
      // passa para as explicações. Fica só /explicacoes-top/disciplinas,
      // escondida, porque é o destino dos emails enviados à lista de espera.
      { source: '/explicacoes-top', destination: '/explicacoes', permanent: true },
      {
        source: '/preparacao',
        destination: '/explicacoes',
        permanent: true,
      },
      {
        source: '/preparacao/:path*',
        destination: '/explicacoes',
        permanent: true,
      },
      {
        source: '/marcar',
        destination: '/explicacoes',
        permanent: true,
      },
      {
        source: '/segunda-fase',
        destination: '/explicacoes',
        permanent: true,
      },
      // Páginas retiradas na limpeza de outubro de 2026.
      { source: '/cronograma', destination: '/exames/cronogramas', permanent: true },
      { source: '/proximoano', destination: '/explicacoes', permanent: true },
      { source: '/secundario', destination: '/matematica', permanent: true },
      { source: '/exames-nacionais/resolucao-de-exercicios', destination: '/exames', permanent: true },
      { source: '/exames-nacionais/resolucao-de-exercicios/:slug', destination: '/exames', permanent: true },
      // A secção dos exames nacionais passou de /exames-nacionais para /exames.
      { source: '/exames-nacionais', destination: '/exames', permanent: true },
      { source: '/exames-nacionais/:path*', destination: '/exames/:path*', permanent: true },
      // As correções passaram para /matematica/exames, junto da matéria.
      { source: '/correcoes', destination: '/matematica/exames', permanent: true },
      { source: '/correcao-prova-matematica-9-ano-2026', destination: '/matematica/exames', permanent: true },
      { source: '/correcao-prova-ensaio-matematica-9-ano-2026', destination: '/matematica/exames', permanent: true },
      // A calculadora gráfica saiu do 10.º ano para uma secção própria.
      { source: '/matematica/10-ano/calculadora-grafica', destination: '/matematica/calculadora-grafica', permanent: true },
      {
        source: '/notas',
        destination: '/',
        permanent: true,
      },
      {
        source: '/aulas',
        destination: '/',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
