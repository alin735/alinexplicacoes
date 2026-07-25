import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MathRain from '@/components/MathRain';
import { absoluteUrl } from '@/lib/site';
import WaitlistForm from './WaitlistForm';

const PATH = '/matematica-a';

const TITLE = 'Explicações de Matemática A (lista de espera)';
const DESCRIPTION =
  'Vais entrar no secundário e ter Matemática A? Entra na lista de espera das explicações individuais de Matemática A com o Alin e sê dos primeiros a saber quando abrirem as vagas.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: absoluteUrl(PATH) },
  keywords: [
    'explicações matemática a',
    'explicações matemática a 10 ano',
    'explicações matemática secundário',
    'lista de espera explicações matemática a',
  ],
  openGraph: {
    title: 'Explicações de Matemática A | MatemáticaTop',
    description: DESCRIPTION,
    url: absoluteUrl(PATH),
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function MatematicaAPage() {
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
              Explicações de Matemática A
            </h1>
            <p className="text-gray-700 max-w-2xl mx-auto text-base sm:text-lg">
              Vais entrar no secundário e vais ter <strong className="text-[#000000]">Matemática A</strong>?
              Prepara-te com explicações <strong className="text-[#000000]">individuais comigo</strong> (o Alin).
              Entra na lista de espera e és dos primeiros a saber quando abrirem as vagas para o próximo ano.
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
