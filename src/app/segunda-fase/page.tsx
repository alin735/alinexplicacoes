import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MathRain from '@/components/MathRain';
import { absoluteUrl } from '@/lib/site';
import SegundaFaseClient from './SegundaFaseClient';

const PATH = '/segunda-fase';
const TITLE = 'Vais à segunda fase de Matemática? Entra na lista de espera | MatemáticaTop';
const DESCRIPTION =
  'Precisas de ir à segunda fase do exame de Matemática? Entra na lista de espera das Explicações Top e sê dos primeiros a saber quando abrirmos a preparação.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: absoluteUrl(PATH) },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: absoluteUrl(PATH),
    type: 'website',
    locale: 'pt_PT',
  },
};

export default function SegundaFasePage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-white">
        <section className="relative overflow-hidden border-b border-black/15 bg-white px-4 pb-12 pt-32">
          <MathRain speed="fast" />
          <div className="relative z-10 max-w-xl mx-auto text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#f59e0b]/40 bg-[#fff7ed] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#b45309] mb-4">
              Segunda fase · Matemática
            </span>
            <h1 className="text-3xl sm:text-5xl font-black text-[#000000] mb-4">
              Precisas de ir à segunda fase?
            </h1>
            <p className="text-gray-700 max-w-md mx-auto text-base sm:text-lg">
              Nós ajudamos-te a preparares-te. Clica no botão abaixo e entra na lista de espera das{' '}
              <strong className="text-[#000000]">Explicações Top</strong>.
            </p>
          </div>
        </section>

        <section className="px-4 py-12">
          <div className="max-w-md mx-auto">
            <SegundaFaseClient />
            <p className="mt-4 text-center text-xs text-gray-400">
              És dos primeiros a saber quando abrirmos a preparação para a segunda fase.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
