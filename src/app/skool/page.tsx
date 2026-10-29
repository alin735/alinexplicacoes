import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, Faq, PageHero, Pill, Section, type Pergunta } from '@/components/ui';
import { absoluteUrl } from '@/lib/site';
import WaitlistForm from './WaitlistForm';

const PATH = '/skool';
const TITLE = 'Rumo ao 20: preparação completa para cada teste do secundário';
const DESCRIPTION =
  'Entra na lista de espera do Rumo ao 20: toda a matéria do secundário em vídeo, tipos de exercício resolvidos, fichas, testes modelo e explicações ao vivo todas as semanas. Os 50 primeiros a entrar ficam como membros fundadores a 19 €/mês.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: absoluteUrl(PATH) },
  openGraph: {
    title: 'Rumo ao 20 | MatemáticaTop',
    description: DESCRIPTION,
    url: absoluteUrl(PATH),
    type: 'website',
    locale: 'pt_PT',
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
  },
};

const CHIPS = ['Ainda não abriu', 'Entrar não custa nada', '50 lugares de fundador'];

const DENTRO = [
  {
    titulo: 'Toda a matéria do secundário em vídeo',
    texto:
      'Módulos por ano e por tema, com os pontos essenciais de cada um. Abres o teu ano, escolhes o tema que vais ter no próximo teste e tens tudo explicado de raiz.',
  },
  {
    titulo: 'Os tipos de exercício resolvidos',
    texto:
      'Perceber a matéria não chega se o formato da pergunta for novidade no dia do teste. Vou resolvendo os tipos de exercício que saem, um a um, para que no teste já os tenhas visto.',
  },
  {
    titulo: 'Fichas, provas e testes modelo',
    texto:
      'Fichas-resumo para a véspera, fichas de avaliação, provas e testes modelo para praticares a sério, tudo já separado por tema.',
  },
  {
    titulo: 'Explicações ao vivo todas as semanas',
    texto:
      'Mandas o exercício ou a dúvida durante a semana e eu resolvo na aula. Fica tudo gravado, por isso não perdes nada se não puderes aparecer.',
  },
  {
    titulo: 'Dúvidas respondidas durante a semana',
    texto:
      'Entre aulas, pões a dúvida na comunidade. Respondo eu e respondem os explicadores que trabalham comigo.',
  },
  {
    titulo: 'Guião para o exame',
    texto:
      'Perto do exame abre o módulo que interessa: a matéria essencial e os tipos de exercício que costumam sair, pelo caminho mais curto até à nota de que precisas.',
  },
];

const PERGUNTAS: Pergunta[] = [
  {
    pergunta: 'Dizem-me o que vai sair no teste?',
    resposta:
      'Não, e desconfia de quem disser que diz. O que faço é dar-te a preparação completa: a matéria toda explicada, os pontos essenciais de cada tema, os tipos de exercício resolvidos e material para praticares. Chegas ao teste preparado, não a adivinhar.',
  },
  {
    pergunta: 'Quando é que abre?',
    resposta:
      'Ainda não tenho data. Estou a montar os módulos primeiro, porque não quero abrir com a casa meio vazia. Quem estiver na lista sabe antes de toda a gente.',
  },
  {
    pergunta: 'Entrar na lista compromete-me a alguma coisa?',
    resposta:
      'Não. Deixas o email, recebes o aviso quando abrir e decides nessa altura. Se não quiseres, não fazes nada e não te chateio mais.',
  },
  {
    pergunta: 'Para que anos é?',
    resposta: '10.º, 11.º e 12.º. Para já é só secundário.',
  },
  {
    pergunta: 'Como é que se paga?',
    resposta:
      'O Rumo ao 20 fica alojado no Skool, que só aceita cartão. Se ainda és menor, o mais simples é tratares disto com os teus pais.',
  },
  {
    pergunta: 'Já tenho explicações contigo. Vale a pena?',
    resposta:
      'Vale a pena. Uma coisa não substitui a outra: as explicações são a hora em que estamos só os dois, o Rumo ao 20 é o resto da semana.',
  },
];

export default function SkoolPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#f5f5f5]">
        <PageHero
          pilula="Em breve · Lista de espera"
          titulo="Rumo ao 20"
          descricao={
            <>
              <span className="mt-1 block text-lg font-bold text-[#000000] sm:text-xl">
                Preparação completa para cada teste do secundário.
              </span>
              <span className="mt-4 block">
                Toda a matéria em vídeo, os tipos de exercício resolvidos, fichas, testes modelo e
                explicações ao vivo todas as semanas. Em vez de estudares sozinho por um manual e
                torcer para teres visto o suficiente, tens tudo num sítio e alguém do outro lado
                para as dúvidas que aparecerem.
              </span>
            </>
          }
        >
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {CHIPS.map((chip) => (
              <Pill key={chip} tom="neutro">
                {chip}
              </Pill>
            ))}
          </div>
        </PageHero>

        {/* A oferta */}
        <Section largura="larga">
          <div className="overflow-hidden rounded-2xl border border-black/15 bg-[#111111] px-6 py-10 shadow-sm sm:px-10">
            <div className="grid items-center gap-8 lg:grid-cols-[1fr_auto]">
              <div>
                <Pill tom="destaque" sobretitulo>
                  Só para quem entrar antes de abrir
                </Pill>
                <h2 className="mt-4 text-3xl font-black text-white sm:text-4xl">
                  Membro fundador: 19 €/mês e nunca mais sobe
                </h2>
                <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/70">
                  Quando o Rumo ao 20 abrir, a mensalidade é de 29 €. Os primeiros 50 a entrar ficam
                  nos 19 € por mês e mantêm esse preço enquanto forem membros, mesmo depois de o
                  valor subir para toda a gente. São 10 € a menos todos os meses, cerca de 35%.
                </p>
                <p className="mt-3 max-w-2xl text-base leading-relaxed text-white/70">
                  Quem está na lista de espera é avisado primeiro e chega aos lugares antes de toda
                  a gente.
                </p>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/50">
                  Entrar na lista é só deixares o email. Não pagas nada agora, não ficas preso a
                  nada e decides quando abrir.
                </p>
              </div>
              <a
                href="#lista"
                className="inline-flex w-fit items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-sm font-bold text-[#000000] transition-all hover:-translate-y-0.5 hover:bg-[#f5f5f5]"
              >
                Quero o meu lugar de fundador
                <span aria-hidden>→</span>
              </a>
            </div>
          </div>
        </Section>

        {/* O que está lá dentro */}
        <Section titulo="O que vais encontrar lá dentro" largura="larga">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {DENTRO.map((item) => (
              <Card key={item.titulo}>
                <h3 className="text-lg font-black leading-snug text-[#000000]">{item.titulo}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{item.texto}</p>
              </Card>
            ))}
          </div>
        </Section>

        {/* Porque é que fiz isto */}
        <Section fundo="branco" separador largura="media" className="border-t border-black/15">
          <h2 className="text-2xl font-black text-[#000000] sm:text-3xl">Porque é que fiz isto</h2>
          <div className="mt-6 space-y-4 text-base leading-relaxed text-gray-700">
            <p>
              Dou explicações individuais e faço vídeos para milhares de pessoas. A diferença entre
              as duas coisas é enorme.
            </p>
            <p>
              Num vídeo não sei quem tu és. Não sei em que ano andas, o que percebeste, nem onde te
              enganaste no último teste. Por isso às vezes posso acabar por dar dicas mais
              genéricas, que podem não servir para ti.
            </p>
            <p>
              Numa explicação já não é assim. Falo com o aluno individualmente para tentar perceber
              onde está o problema e ajudar a resolvê-lo.
            </p>
            <p>
              O Rumo ao 20 foi feito para isso mesmo: através de um acompanhamento mais
              personalizado, ajudar um maior número de pessoas a alcançar os seus objetivos.
            </p>
          </div>
        </Section>

        <Section titulo="Perguntas frequentes" largura="larga">
          <Faq perguntas={PERGUNTAS} />
        </Section>

        {/* Formulário */}
        <Section largura="estreita" className="scroll-mt-24" id="lista">
          <div className="mx-auto max-w-md">
            <WaitlistForm />
          </div>
        </Section>
      </main>
      <Footer />
    </>
  );
}
