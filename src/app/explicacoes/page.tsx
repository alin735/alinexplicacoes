import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { PageHero, Pill, Section } from '@/components/ui';
import { absoluteUrl } from '@/lib/site';
import { getPricePerStudentCents } from '@/lib/booking-utils';
import LeadSection from './LeadSection';

const euros = (cents: number) => `${Math.round(cents / 100)}€`;

const priceTiers = [
  { label: 'Individual', sub: '1 aluno', price: '17€', highlight: false },
  { label: '2 alunos', sub: 'por aluno', price: `desde ${euros(getPricePerStudentCents(2))}`, highlight: false },
  { label: '3 alunos', sub: 'por aluno', price: euros(getPricePerStudentCents(3)), highlight: false },
  { label: '4 alunos', sub: 'por aluno', price: euros(getPricePerStudentCents(4)), highlight: false },
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
        <PageHero
          titulo="Explicações de Matemática"
          descricao={
            <>
              Aulas <strong className="text-[#000000]">online</strong> de Matemática,{' '}
              <strong className="text-[#000000]">individuais a 17€/hora</strong>. Em grupo
              com colegas, o valor por aluno desce até 8€.
              Diz-me em que precisas e trato de tudo contigo: explicador, horário e plano à tua medida.
            </>
          }
        >
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
            <Pill tom="confirma" sobretitulo>
              <span aria-hidden>✓</span>
              Pedir é gratuito e sem compromisso
            </Pill>
          </div>
        </PageHero>

        <Section largura="media">
          <div className="text-center mb-6">
            <h2 className="text-2xl sm:text-3xl font-black text-[#000000]">
              Quanto mais amigos, mais barato
            </h2>
            <p className="text-gray-600 mt-2 text-sm sm:text-base max-w-2xl mx-auto">
              O preço é por aluno, por hora. Junta colegas e o valor desce para todos. As aulas de
              grupo são na mesma turma e ao mesmo ritmo.
            </p>
          </div>
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
            {priceTiers.map((tier) => (
              <div
                key={tier.label}
                className={`rounded-2xl p-5 text-center shadow-sm ${
                  tier.highlight
                    ? 'bg-[#111111] text-white ring-2 ring-[#f59e0b]'
                    : 'border border-black/15 bg-white text-[#000000]'
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
            Valores por aluno, por hora. As aulas de grupo precisam de colegas do mesmo ano e
            disponíveis à mesma hora.
          </p>
        </Section>

        <LeadSection />
      </main>
      <Footer />
    </>
  );
}
