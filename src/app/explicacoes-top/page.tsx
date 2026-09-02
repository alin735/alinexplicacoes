import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { PageHero, Section } from '@/components/ui';
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
        <PageHero
          pilula="Em breve · Lista de espera"
          titulo="As Explicações Top estão a chegar 🚀"
          descricao={
            <>
              Vamos abrir explicações de qualidade para praticamente{' '}
              <strong className="text-[#000000]">todas as disciplinas</strong>, a um preço acessível.
              Entra na lista de espera e és das primeiras pessoas a saber quando abrirmos as vagas.
            </>
          }
        />

        <Section largura="estreita">
          <div className="mx-auto max-w-md">
            <WaitlistForm />
          </div>
        </Section>
      </main>
      <Footer />
    </>
  );
}
