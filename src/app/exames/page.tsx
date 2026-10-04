import Link from 'next/link';
import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { HighlightCard, PageHero, Pill, Section } from '@/components/ui';
import { absoluteUrl } from '@/lib/site';

const EXAM_SECTIONS = [
  {
    title: 'O que sai nos exames',
    description: 'Consulta a frequência com que cada tema apareceu entre 2016 e 2025.',
    href: '/exames/o-que-sai',
    imageSrc: '/images/exames/o-que-sai-nos-exames.png',
    cta: 'Ver os temas',
  },
  {
    title: 'Cronogramas',
    description: 'Organiza o estudo com um plano de preparação à tua medida.',
    href: '/exames/cronogramas',
    imageSrc: '/images/exames/cronogramas.png',
    cta: 'Montar o meu plano',
  },
] as const;


export const metadata: Metadata = {
  title: 'Exame nacional de Matemática: o que sai e cronogramas de estudo',
  description: 'Prepara o exame nacional de Matemática A e a prova final do 9.º ano: o que sai em cada tema desde 2016, cronogramas de estudo e exames resolvidos.',
  alternates: { canonical: absoluteUrl('/exames') },
  openGraph: {
    title: 'Exame nacional de Matemática: o que sai e cronogramas de estudo | MatemáticaTop',
    description: 'Prepara o exame nacional de Matemática A e a prova final do 9.º ano: o que sai em cada tema desde 2016, cronogramas de estudo e exames resolvidos.',
    url: absoluteUrl('/exames'),
  },
};

export default function ExamesNacionaisPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#f5f5f5]">
        <PageHero
          pilula="Exame nacional 2027"
          titulo="Exames nacionais"
          descricao="Aqui encontras cronogramas de estudo e a informação sobre os temas que saem no exame."
          largura="total"
        >
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

        <Section titulo="Estuda a matéria que sai no exame" largura="larga" fundo="branco" separador>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { href: '/matematica/9-ano', titulo: '9.º ano', texto: 'A matéria da prova final, em vídeo, por tema.' },
              { href: '/matematica/12-ano', titulo: 'Matemática A', texto: 'A matéria do 10.º ao 12.º ano, em vídeo, por tema.' },
              { href: '/matematica/exames', titulo: 'Exames resolvidos', texto: 'A prova final e o exame nacional corrigidos em vídeo.' },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="group rounded-2xl border border-black/15 bg-[#f5f5f5] p-5 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md"
              >
                <span className="block text-lg font-black text-[#000000]">{l.titulo}</span>
                <span className="mt-1 block text-sm text-gray-600">{l.texto}</span>
              </Link>
            ))}
          </div>
        </Section>
      </main>
      <Footer />
    </>
  );
}
