import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { HighlightCard, PageHero, Pill, Section } from '@/components/ui';
import { absoluteUrl } from '@/lib/site';

const EXAM_SECTIONS = [
  {
    title: 'O que sai nos exames',
    description: 'Consulta a frequência com que cada tema apareceu entre 2016 e 2025.',
    href: '/exames-nacionais/o-que-sai',
    imageSrc: '/images/exames/o-que-sai-nos-exames.png',
    cta: 'Ver os temas',
  },
  {
    title: 'Cronogramas',
    description: 'Organiza o estudo com um plano de preparação à tua medida.',
    href: '/exames-nacionais/cronogramas',
    imageSrc: '/images/exames/cronogramas.png',
    cta: 'Montar o meu plano',
  },
] as const;

const CHIPS = ['Exame a 22 de junho de 2026', 'Dados de 2016 a 2025'];

export const metadata: Metadata = {
  title: 'Exames Nacionais',
  description: 'Cronogramas e temas do Exame Nacional de Matemática.',
  alternates: { canonical: absoluteUrl('/exames-nacionais') },
  openGraph: {
    title: 'Exames Nacionais | MatemáticaTop',
    description: 'Cronogramas e temas do Exame Nacional de Matemática.',
    url: absoluteUrl('/exames-nacionais'),
  },
};

export default function ExamesNacionaisPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#f5f5f5]">
        <PageHero
          pilula="Exame Nacional 2026"
          titulo="Exames Nacionais"
          descricao="Aqui encontras cronogramas de estudo e a informação sobre os temas que saem no exame."
          largura="total"
        >
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {CHIPS.map((chip) => (
              <Pill key={chip} tom="neutro">
                {chip}
              </Pill>
            ))}
          </div>
        </PageHero>

        <Section titulo="Ferramentas disponíveis" largura="larga">
          <div className="grid gap-6 sm:grid-cols-2">
            {EXAM_SECTIONS.map((section) => (
              <HighlightCard
                key={section.href}
                href={section.href}
                titulo={section.title}
                descricao={section.description}
                chamada={section.cta}
                imagem={section.imageSrc}
                imagemAlt={section.title}
              />
            ))}
          </div>
        </Section>
      </main>
      <Footer />
    </>
  );
}
