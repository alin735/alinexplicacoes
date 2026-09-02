import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { PageHero, Section } from '@/components/ui';
import { absoluteUrl } from '@/lib/site';
import WaitlistForm from './WaitlistForm';

const PATH = '/proximoano';

const TITLE = 'Explicações de Matemática A (lista de espera)';
const DESCRIPTION =
  'Vais entrar no secundário e ter Matemática A? Entra na lista de espera das explicações de Matemática A com o Alin e sê dos primeiros a saber quando abrirem as vagas.';

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
        <PageHero
          pilula="Em breve · Lista de espera"
          titulo="Explicações de Matemática A"
          descricao={
            <>
              Vais entrar no secundário e vais ter <strong className="text-[#000000]">Matemática A</strong>?
              Prepara-te com explicações <strong className="text-[#000000]">comigo</strong> (o Alin).
              Entra na lista de espera e és dos primeiros a saber quando abrirem as vagas para o próximo ano.
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
