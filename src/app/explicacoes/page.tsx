import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MathRain from '@/components/MathRain';
import { absoluteUrl } from '@/lib/site';
import { getPricePerStudentCents } from '@/lib/booking-utils';
import LeadSection from './LeadSection';

const euros = (cents: number) => `${Math.round(cents / 100)}€`;

const priceTiers = [
  { label: 'Individual', sub: '1 aluno', price: 'desde 14€', highlight: false },
  { label: '2 alunos', sub: 'por aluno', price: euros(getPricePerStudentCents(2)), highlight: false },
  { label: '3 a 4 alunos', sub: 'por aluno', price: euros(getPricePerStudentCents(3)), highlight: false },
  { label: '5 ou mais', sub: 'por aluno', price: euros(getPricePerStudentCents(5)), highlight: true },
];

export const metadata: Metadata = {
  title: 'Explicações de Matemática',
  description:
    'Explicações de Matemática individuais e em grupo. Diz-nos o que precisas e ajudamos-te a escolher o explicador, o horário e o plano certos para ti.',
  alternates: {
    canonical: absoluteUrl('/explicacoes'),
  },
  openGraph: {
    title: 'Explicações de Matemática | MatemáticaTop',
    description:
      'Diz-nos o que precisas e ajudamos-te a escolher o explicador, o horário e o plano certos para ti.',
    url: absoluteUrl('/explicacoes'),
  },
};

export default function ExplicacoesPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#f5f5f5]">
        <div className="relative overflow-hidden border-b border-black/15 bg-white px-4 pb-12 pt-32">
          <MathRain speed="fast" />
          <div className="relative z-10 max-w-6xl mx-auto text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#f59e0b]/40 bg-[#fff7ed] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#b45309] mb-4">
              Vagas limitadas · o Exame está a chegar
            </span>
            <h1 className="text-4xl sm:text-5xl font-black text-[#000000] mb-3">
              Explicações de Matemática
            </h1>
            <p className="text-gray-700 max-w-2xl mx-auto text-base sm:text-lg">
              Aulas <strong className="text-[#000000]">online</strong> de Matemática{' '}
              <strong className="text-[#000000]">a partir de 6€/hora</strong>, individuais ou em grupo.
              Diz-me em que precisas e trato de tudo contigo: explicador, horário e plano à tua medida.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#16a34a]/30 bg-[#f0fdf4] px-3.5 py-1.5 text-xs font-semibold text-[#15803d]">
                <span aria-hidden>✓</span>
                Pedir é gratuito e sem compromisso
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#f59e0b]/40 bg-[#fff7ed] px-3.5 py-1.5 text-xs font-semibold text-[#b45309]">
                <span aria-hidden>★</span>
                1.ª aula com desconto
              </span>
            </div>
          </div>
        </div>

        <section className="px-4 pt-10">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-6">
              <h2 className="text-2xl sm:text-3xl font-black text-[#000000]">
                Quanto mais amigos, mais barato
              </h2>
              <p className="text-gray-600 mt-2 text-sm sm:text-base max-w-2xl mx-auto">
                O preço é por aluno, por hora. Junta colegas e o valor desce para todos. As aulas de
                grupo são na mesma turma e ao mesmo ritmo.
              </p>
            </div>
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
              {priceTiers.map((tier) => (
                <div
                  key={tier.label}
                  className={`rounded-2xl p-5 text-center shadow-md ${
                    tier.highlight
                      ? 'bg-[#111111] text-white ring-2 ring-[#f59e0b]'
                      : 'bg-white text-[#000000]'
                  }`}
                >
                  <p
                    className={`text-xs font-semibold uppercase tracking-wide ${
                      tier.highlight ? 'text-white/70' : 'text-gray-500'
                    }`}
                  >
                    {tier.label}
                  </p>
                  <p className="mt-2 text-2xl font-black">{tier.price}</p>
                  <p className={`mt-1 text-xs ${tier.highlight ? 'text-white/70' : 'text-gray-500'}`}>
                    {tier.sub} · por hora
                  </p>
                </div>
              ))}
            </div>
            <p className="text-center text-xs text-gray-500 mt-4">
              Valores por aluno, por hora. O valor da explicação individual é combinado contigo,
              conforme o que precisas.
            </p>
          </div>
        </section>

        <LeadSection />

        <section className="px-4 pt-10 pb-12">
          <div className="mx-auto flex max-w-4xl justify-center">
            <Link
              href="/marcar/informacoes"
              className="inline-flex items-center justify-center gap-2.5 self-center rounded-xl border border-[#000000]/25 bg-white px-5 py-2.5 text-sm font-semibold text-[#000000] transition-all hover:bg-[#fafafa]"
            >
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#111111] text-white text-xs font-bold">
                i
              </span>
              Mais informações sobre as explicações
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
