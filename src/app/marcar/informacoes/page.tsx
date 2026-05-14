'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MathRain from '@/components/MathRain';

export default function InformacoesExplicacoesPage() {
  const [isGroup, setIsGroup] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const type = params.get('tipo');
    setIsGroup(type === 'grupo' || type === 'group');
  }, []);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#f5f5f5]">
        <div className="relative overflow-hidden border-b border-black/15 bg-white px-4 pb-12 pt-32">
          <MathRain speed="fast" />
          <div className="relative z-10 mx-auto max-w-5xl text-center">
            <h1 className="mb-2 text-4xl font-black text-[#000000] sm:text-5xl">
              {isGroup ? 'Informações - Aulas de grupo' : 'Informações - Explicações individuais'}
            </h1>
            <p className="text-gray-600">
              {isGroup
                ? 'Tudo o que precisas de saber antes de entrar na turma.'
                : 'Tudo o que precisas de saber antes de marcar a tua explicação.'}
            </p>
          </div>
        </div>

        <div className="mx-auto grid max-w-4xl gap-6 px-4 py-10">
          {isGroup ? (
            <>
              <section className="rounded-2xl bg-white p-6 shadow-md">
                <h2 className="mb-4 text-xl font-bold text-[#000000]">Como funcionam as aulas de grupo</h2>
                <div className="space-y-3 text-sm leading-relaxed text-gray-700">
                  <p>As aulas decorrem no Discord, com partilha de ecrã.</p>
                  <p>O Alin explica a matéria em direto e resolve exercícios adequados ao exame.</p>
                  <p>
                    No final de cada aula, os materiais usados (exercícios, resoluções e fichas de apoio) são
                    disponibilizados aos alunos.
                  </p>
                  <p>As dúvidas após a aula podem ser enviadas por mensagem para acompanhamento.</p>
                </div>
              </section>

              <section className="rounded-2xl bg-white p-6 shadow-md">
                <h2 className="mb-4 text-xl font-bold text-[#000000]">Horário, faltas e compensação</h2>
                <div className="space-y-3 text-sm leading-relaxed text-gray-700">
                  <p>As turmas têm 2 aulas por semana, com 1 hora por aula.</p>
                  <p>
                    Se não conseguires comparecer por motivo pertinente, podes assistir a outra aula para compensar.
                  </p>
                </div>
              </section>

              <section className="rounded-2xl bg-white p-6 shadow-md">
                <h2 className="mb-4 text-xl font-bold text-[#000000]">Pagamento e reembolso</h2>
                <div className="space-y-3 text-sm leading-relaxed text-gray-700">
                  <p>A entrada na turma requer pagamento de 70€/mês no site.</p>
                  <p>
                    O reembolso total é possível até ao início da 2.ª aula, ou por insatisfação total do aluno quando
                    relacionada exclusivamente com as explicações e com o Alin.
                  </p>
                </div>
              </section>

              <section className="rounded-2xl border border-[#000000]/15 bg-white p-6 shadow-md">
                <h2 className="mb-4 text-xl font-bold text-[#000000]">Pronto para entrar?</h2>
                <p className="text-sm text-gray-700">
                  Podes aderir diretamente em <Link href="/preparacao" className="font-semibold underline underline-offset-2">Preparação Exame</Link>.
                </p>
              </section>
            </>
          ) : (
            <>
              <section className="rounded-2xl bg-white p-6 shadow-md">
                <h2 className="mb-4 text-xl font-bold text-[#000000]">Como funcionam as explicações individuais</h2>
                <div className="space-y-2 text-sm leading-relaxed text-gray-700">
                  <p>1) Nas explicações individuais, escolhes o dia, a hora, o ano e o tema em que precisas de apoio.</p>
                  <p>2) Cada marcação é preparada para as tuas dificuldades e objetivos do momento.</p>
                  <p>3) Depois de marcares, recebes acompanhamento direto durante a aula e materiais de apoio.</p>
                  <p>4) O foco é resolver o que precisas agora, com explicação clara e ritmo adequado ao teu nível.</p>
                </div>
              </section>

              <section className="rounded-2xl bg-white p-6 shadow-md">
                <h2 className="mb-4 text-xl font-bold text-[#000000]">Como fazer marcação individual</h2>
                <div className="space-y-3 text-sm leading-relaxed text-gray-700">
                  <p>1) Escolhe no calendário o dia e a hora com vaga.</p>
                  <p>2) Seleciona o ano e o tema de Matemática.</p>
                  <p>3) Define se a aula é individual ou uma marcação em grupo.</p>
                  <p>
                    4) Se for grupo, pede aos colegas o código na aba{' '}
                    <Link href="/conta" className="font-semibold underline underline-offset-2">
                      Conta
                    </Link>{' '}
                    e cola os códigos separados por vírgula.
                  </p>
                  <p>5) Opcionalmente, adiciona observações sobre o que queres melhorar.</p>
                  <p>6) Confirma e avança para pagamento; em grupo, a marcação só fica concluída quando todos pagarem.</p>
                </div>
              </section>

              <section className="rounded-2xl bg-white p-6 shadow-md">
                <h2 className="mb-4 text-xl font-bold text-[#000000]">Como decorrem as aulas</h2>
                <div className="space-y-3 text-sm leading-relaxed text-gray-700">
                  <p>
                    Depois de fazeres a marcação e efetuares o pagamento, manda uma mensagem ao Alin via chat do site
                    ou comunidade do Discord para que ele possa entrar em contacto contigo para preparar a aula.
                  </p>
                  <p>
                    A explicação é dada em chamada no Discord, em conjunto com a plataforma Miro. O Miro é uma
                    ferramenta interativa onde também podes escrever durante a aula.
                  </p>
                  <p>
                    Se tiveres um dispositivo que facilite essa escrita, melhor. Ainda assim, a explicação não fica
                    comprometida se não o tiveres.
                  </p>
                  <p>
                    Todos os materiais utilizados na aula ficam guardados na secção{' '}
                    <Link href="/aulas" className="font-semibold underline underline-offset-2">
                      Minhas aulas
                    </Link>.
                  </p>
                </div>
              </section>

              <section className="rounded-2xl bg-white p-6 shadow-md">
                <h2 className="mb-4 text-xl font-bold text-[#000000]">Desmarcações e problemas</h2>
                <div className="space-y-3 text-sm leading-relaxed text-gray-700">
                  <p>
                    A desmarcação de uma aula só é possível se for avisada com pelo menos uma hora de antecedência.
                  </p>
                  <p>
                    Se surgir algum imprevisto ou algum problema com a marcação, entra em contacto assim que possível
                    para analisar a situação.
                  </p>
                </div>
              </section>

              <section className="rounded-2xl bg-white p-6 shadow-md">
                <h2 className="mb-4 text-xl font-bold text-[#000000]">Reembolsos</h2>
                <div className="space-y-4 text-sm leading-relaxed text-gray-700">
                  <p>O reembolso do valor pago por uma determinada explicação será realizado se se verificar alguma das seguintes situações:</p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>A aula não foi realizada devido à não comparência do Alin.</li>
                    <li>O aluno estiver insatisfeito com a explicação por motivos relacionado unicamente com a explicação e com o Alin.</li>
                  </ul>
                  <p>Não será admitido o reembolso se:</p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>O aluno não comparecer à aula sem ter avisado com antecedência.</li>
                    <li>A aula já tiver sido realizada sem que tivessem sido levantados problemas.</li>
                    <li>Os motivos de insatisfação do aluno estiverem relacionados com o seu empenho e esforço.</li>
                  </ul>
                </div>
              </section>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
