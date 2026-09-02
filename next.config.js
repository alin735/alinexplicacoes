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
  async redirects() {
    return [
      {
        source: '/blog/correcao-da-prova-ensaio-9ano',
        destination: '/correcao-prova-ensaio-matematica-9-ano-2026',
        permanent: true,
      },
      // Páginas retiradas na reformulação. Os endereços antigos continuam a
      // andar por links, mensagens e resultados de pesquisa, por isso apontam
      // para o sítio que hoje faz o trabalho delas em vez de darem erro.
      {
        source: '/preparacao',
        destination: '/explicacoes-top',
        permanent: true,
      },
      {
        source: '/preparacao/:path*',
        destination: '/explicacoes-top',
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
