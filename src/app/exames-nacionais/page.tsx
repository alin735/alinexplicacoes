import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MathRain from '@/components/MathRain';
import { absoluteUrl } from '@/lib/site';

const EXAM_SECTIONS = [
  {
    title: 'O que sai nos exames',
    description:
      'Consulta a frequência com que cada tema apareceu entre 2016 e 2025.',
    href: '/exames-nacionais/o-que-sai',
    imageSrc: '/images/exames/o-que-sai-nos-exames.png',
  },
  {
    title: 'Resolução de exames',
    description:
      'Revê exercícios resolvidos por ano e por tema.',
    href: '/exames-nacionais/resolucao-de-exercicios',
    imageSrc: '/images/exames/resolucao-de-exercicios.png',
  },
  {
    title: 'Cronogramas',
    description:
      'Organiza o estudo com um plano de preparação.',
    href: '/exames-nacionais/cronogramas',
    imageSrc: '/images/exames/cronogramas.png',
  },
] as const;

export const metadata: Metadata = {
  title: 'Exames Nacionais',
  description:
    'Cronogramas, temas e exercícios resolvidos para o Exame Nacional.',
  alternates: {
    canonical: absoluteUrl('/exames-nacionais'),
  },
  openGraph: {
    title: 'Exames Nacionais | MatemáticaTop',
    description:
      'Cronogramas, temas e exercícios resolvidos para o Exame Nacional.',
    url: absoluteUrl('/exames-nacionais'),
  },
};

export default function ExamesNacionaisPage() {
  return (
    <>
      <Navbar />
      <main className="bg-[#f5f5f5]">
        <section className="relative bg-white border-b border-black/15 px-4 pb-12 pt-32 overflow-hidden">
          <MathRain speed="fast" />
          <div className="relative z-10 max-w-6xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl font-black text-[#000000] mb-2">
              Exames Nacionais
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Aqui encontras cronogramas, informação sobre os temas do exame e exercícios resolvidos.
            </p>
          </div>
        </section>

        <section className="px-4 pt-12 pb-8">
          <div className="max-w-6xl mx-auto grid gap-6 lg:grid-cols-3">
            {EXAM_SECTIONS.map((section) => (
              <Link
                key={section.href}
                href={section.href}
                className="group overflow-hidden rounded-[2.25rem] border border-black/10 bg-white shadow-[0_24px_60px_rgba(0,0,0,0.08)] transition-all hover:-translate-y-1.5 hover:shadow-[0_30px_75px_rgba(17,17,17,0.12)]"
              >
                <div className="relative aspect-[1/1] overflow-hidden bg-[#3f6c93]">
                  <Image
                    src={section.imageSrc}
                    alt={section.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                </div>
                <div className="p-6">
                  <h2 className="text-2xl font-black text-[#111111] mb-3">{section.title}</h2>
                  <p className="text-sm leading-relaxed text-gray-600">{section.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
