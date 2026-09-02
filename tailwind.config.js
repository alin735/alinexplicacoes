/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Paleta do site. Ver src/components/ui/tokens.ts para o significado
        // de cada tom e para as peças de classe que os usam.
        tinta: {
          DEFAULT: '#000000',
          suave: '#111111',
          media: '#2a2a2a',
          fraca: '#6b7280',
        },
        destaque: {
          DEFAULT: '#f59e0b',
          fundo: '#fff7ed',
          texto: '#b45309',
        },
        confirma: {
          DEFAULT: '#16a34a',
          fundo: '#f0fdf4',
          texto: '#15803d',
        },
      },
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
