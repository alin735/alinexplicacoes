import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MathRain from '@/components/MathRain';
import { absoluteUrl } from '@/lib/site';
import CorrecaoClient from './CorrecaoClient';

const COMMUNITY_URL = 'https://discord.gg/7eK2QAsp23';
const PATH = '/correcao-prova-matematica-9-ano-2026';

const TITLE = 'Correção da Prova de Matemática do 9.º Ano 2026 (Resolução Completa)';
const DESCRIPTION =
  'Correção e resolução completa da prova final de Matemática do 9.º ano de 2026, reconstruída pela comunidade MatemáticaTop. Vê o enunciado e a resolução questão a questão.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: absoluteUrl(PATH) },
  keywords: [
    'correção prova matemática 9 ano 2026',
    'resolução prova matemática 9 ano 2026',
    'exame matemática 9 ano 2026',
    'prova final matemática 9 ano',
    'correção exame matemática nono ano',
  ],
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: absoluteUrl(PATH),
    type: 'article',
    locale: 'pt_PT',
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function CorrecaoProvaMat9Page() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-white">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-black/15 bg-white px-4 pb-12 pt-32">
          <MathRain speed="fast" />
          <div className="relative z-10 max-w-3xl mx-auto text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#f59e0b]/40 bg-[#fff7ed] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#b45309] mb-4">
              Prova de 22 de junho de 2026
            </span>
            <h1 className="text-3xl sm:text-5xl font-black text-[#000000] mb-4">
              Correção da Prova de Matemática do 9.º Ano · 2026
            </h1>
            <p className="text-gray-700 max-w-2xl mx-auto text-base sm:text-lg">
              Enunciado e <strong className="text-[#000000]">resolução completa</strong>, questão a
              questão. A versão que o IAVE não vai publicar — reconstruída pela nossa comunidade.
            </p>
          </div>
        </section>

        {/* Introdução */}
        <section className="px-4 pt-10">
          <div className="max-w-3xl mx-auto">
            <div className="prose-sm text-gray-700 space-y-4 text-[15px] sm:text-base leading-relaxed">
              <p>
                No dia <strong>22 de junho de 2026</strong> realizou-se a prova final de Matemática do
                9.º ano. Ao contrário do habitual, esta prova <strong>não vai ser disponibilizada
                oficialmente pelo IAVE</strong> — o que deixa milhares de alunos sem forma de confirmar
                as suas respostas.
              </p>
              <p>
                Foi aí que entrou a nossa comunidade. Juntando os contributos de dezenas de alunos que
                fizeram a prova, conseguimos{' '}
                <strong>reconstruir o enunciado e elaborar a correção completa</strong>. Se quiseres
                ajudar a melhorá-la ou tirar dúvidas, entra na{' '}
                <a
                  href={COMMUNITY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-black underline underline-offset-4 hover:text-[#5865F2]"
                >
                  nossa comunidade aqui
                </a>
                .
              </p>
              <p className="text-sm text-gray-500">
                Nota: esta é uma reconstrução não oficial feita pela MatemáticaTop e pela sua
                comunidade. Pode conter pequenas diferenças face à prova original.
              </p>
            </div>
          </div>
        </section>

        {/* Funil + documentos */}
        <section className="px-4 py-10">
          <div className="max-w-3xl mx-auto">
            <CorrecaoClient />
          </div>
        </section>

        {/* Bloco explicações (suave) */}
        <section className="px-4 pb-16">
          <div className="max-w-3xl mx-auto rounded-2xl border border-black/15 bg-gray-50 p-6 sm:p-8 text-center">
            <h2 className="text-xl sm:text-2xl font-black text-[#000000]">
              Vais para o secundário? As Explicações Top estão a chegar
            </h2>
            <p className="mt-2 text-gray-600 text-sm sm:text-base max-w-xl mx-auto">
              Quando as aulas começarem, vamos fornecer explicações de qualidade para praticamente
              todas as disciplinas, a um preço acessível. Entra na lista de espera no botão acima e és
              das primeiras pessoas a saber.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
