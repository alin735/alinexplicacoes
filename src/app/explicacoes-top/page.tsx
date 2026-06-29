import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MathRain from '@/components/MathRain';
import { absoluteUrl } from '@/lib/site';
import WaitlistForm from './WaitlistForm';

const PATH = '/explicacoes-top';

const TITLE = 'Explicações Top: lista de espera';
const DESCRIPTION =
  'Entra na lista de espera das Explicações Top: explicações de qualidade para praticamente todas as disciplinas, a um preço acessível. Sê das primeiras pessoas a saber quando abrirmos as vagas.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: absoluteUrl(PATH) },
  openGraph: {
    title: 'Explicações Top: lista de espera | MatemáticaTop',
    description: DESCRIPTION,
    url: absoluteUrl(PATH),
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function ExplicacoesTopPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#f5f5f5]">
        {/* Hero */}
        <div className="relative overflow-hidden border-b border-black/15 bg-white px-4 pb-12 pt-32">
          <MathRain speed="fast" />
          <div className="relative z-10 max-w-3xl mx-auto text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#f59e0b]/40 bg-[#fff7ed] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#b45309] mb-4">
              Em breve · Lista de espera
            </span>
            <h1 className="text-4xl sm:text-5xl font-black text-[#000000] mb-3">
              As Explicações Top estão a chegar 🚀
            </h1>
            <p className="text-gray-700 max-w-2xl mx-auto text-base sm:text-lg">
              Vamos abrir explicações de qualidade para praticamente{' '}
              <strong className="text-[#000000]">todas as disciplinas</strong>, a um preço acessível.
              Entra na lista de espera e és das primeiras pessoas a saber quando abrirmos as vagas.
            </p>
          </div>
        </div>

        {/* Formulário */}
        <section className="px-4 py-10">
          <div className="max-w-md mx-auto">
            <WaitlistForm />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
