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
      {
        source: '/preparacao',
        destination: '/explicacoes-top',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
