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
    description: 'Consulta a frequência com que cada tema apareceu entre 2016 e 2025.',
    href: '/exames-nacionais/o-que-sai',
    imageSrc: '/images/exames/o-que-sai-nos-exames.png',
  },
  {
    title: 'Resolução de exames',
    description: 'Revê exercícios resolvidos por ano e por tema.',
    href: '/exames-nacionais/resolucao-de-exercicios',
    imageSrc: '/images/exames/resolucao-de-exercicios.png',
  },
  {
    title: 'Cronogramas',
    description: 'Organiza o estudo com um plano de preparação.',
    href: '/exames-nacionais/cronogramas',
    imageSrc: '/images/exames/cronogramas.png',
  },
] as const;

export const metadata: Metadata = {
  title: 'Exames Nacionais',
  description: 'Cronogramas, temas e exercícios resolvidos para o Exame Nacional.',
  alternates: { canonical: absoluteUrl('/exames-nacionais') },
  openGraph: {
    title: 'Exames Nacionais | MatemáticaTop',
    description: 'Cronogramas, temas e exercícios resolvidos para o Exame Nacional.',
    url: absoluteUrl('/exames-nacionais'),
  },
};

export default function ExamesNacionaisPage() {
  return (
    <>
      <Navbar />
      <main className="bg-[#f5f5f5]">
        {/* Hero */}
        <section className="relative bg-white border-b border-black/10 px-4 pb-14 pt-32 overflow-hidden">
          <MathRain speed="fast" />
          <div className="relative z-10 max-w-6xl mx-auto text-center">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#5a7ca8] mb-4">
              Exame Nacional 2026
            </p>
            <h1 className="text-4xl sm:text-5xl font-black text-[#000000] mb-3">
              Exames Nacionais
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Aqui encontras cronogramas, informação sobre os temas do exame e exercícios resolvidos.
            </p>

            {/* Quick stats */}
            <div className="mt-8 inline-flex flex-wrap items-center justify-center gap-3">
              {[
                { label: 'Exame a 22 de junho de 2026' },
                { label: 'Dados de 2016 a 2025' },
                { label: 'Exercícios resolvidos' },
              ].map(({ label }) => (
                <span key={label} className="rounded-full border border-black/10 bg-[#f5f5f5] px-4 py-1.5 text-xs font-semibold text-[#111111]">
                  {label}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Preparação banner */}
        <section className="px-4 pt-10 pb-4">
          <div className="max-w-6xl mx-auto">
            <Link
              href="/preparacao"
              className="group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-[2rem] border border-black/10 bg-[#000000] px-6 py-5 shadow-[0_24px_60px_rgba(0,0,0,0.15)] transition-all hover:-translate-y-0.5 hover:shadow-[0_30px_75px_rgba(0,0,0,0.2)]"
            >
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-white/50 mb-1">
                  Preparação Intensiva · 24 mai a 13 jun
                </p>
                <p className="text-lg font-black text-white">
                  Quer uma preparação estruturada para o exame? 15 aulas ao vivo com o Alin.
                </p>
              </div>
              <span className="flex-shrink-0 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-black text-[#000000] transition-all group-hover:bg-[#f5f5f5]">
                Ver preparação
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </span>
            </Link>
          </div>
        </section>

        {/* Sections */}
        <section className="px-4 pt-8 pb-14">
          <div className="max-w-6xl mx-auto">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#5a7ca8] mb-6">
              Ferramentas disponíveis
            </p>
            <div className="grid gap-6 lg:grid-cols-3">
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
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
