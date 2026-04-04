import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main className="pt-20 min-h-screen bg-[#f5f5f5] px-4 py-10">
        <section className="max-w-5xl mx-auto bg-white rounded-2xl shadow-md p-6 sm:p-8 lg:p-10">
          <h1 className="text-4xl sm:text-5xl font-black text-[#000000] mb-2">Termos e condições</h1>
          <p className="text-sm text-gray-500 mb-8">Última atualização: abril de 2026</p>

          <div className="space-y-8 text-sm sm:text-base leading-relaxed text-gray-700">
            <section>
              <h2 className="text-xl font-semibold text-[#000000] mb-3">1. Objeto e âmbito</h2>
              <p>
                Os presentes termos e condições regulam a utilização da plataforma MatemáticaTop e dos serviços
                nela disponibilizados, incluindo a criação de conta, a marcação de explicações, o acesso a
                materiais de apoio, os cronogramas, os conteúdos relativos ao Exame Nacional e as comunicações
                enviadas ao utilizador.
              </p>
              <p className="mt-3">
                Ao utilizar o site, o utilizador declara que leu e aceita estes termos, sem prejuízo dos direitos
                que lhe sejam legalmente reconhecidos enquanto consumidor ao abrigo da legislação portuguesa
                aplicável.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#000000] mb-3">2. Conta de utilizador</h2>
              <p>
                Para aceder a determinadas funcionalidades pode ser necessário criar conta. O utilizador é
                responsável por fornecer dados corretos, completos e atualizados, bem como por guardar de forma
                confidencial as credenciais de acesso.
              </p>
              <p className="mt-3">
                A MatemáticaTop pode limitar, suspender ou encerrar contas em caso de utilização abusiva,
                prestação de informação falsa, tentativa de acesso indevido, utilização contrária à finalidade do
                serviço ou violação destes termos.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#000000] mb-3">3. Serviços disponibilizados</h2>
              <p>A MatemáticaTop pode incluir, entre outros, os seguintes serviços:</p>
              <ul className="mt-3 list-disc space-y-2 pl-6">
                <li>explicações individuais ou em grupo;</li>
                <li>ferramentas de marcação e gestão de aulas;</li>
                <li>materiais e recursos de apoio ao estudo;</li>
                <li>cronogramas de preparação;</li>
                <li>conteúdos e exercícios ligados ao Exame Nacional;</li>
                <li>newsletter e outras comunicações informativas.</li>
              </ul>
              <p className="mt-3">
                Alguns serviços podem estar sujeitos a disponibilidade, confirmação manual, pagamento prévio ou
                requisitos específicos indicados na respetiva página.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#000000] mb-3">4. Marcações, pagamentos e confirmação</h2>
              <p>
                As marcações de explicações estão sempre dependentes da disponibilidade apresentada no site. A
                reserva só se considera definitivamente confirmada após validação do pagamento, quando aplicável,
                e da respetiva aceitação no sistema.
              </p>
              <p className="mt-3">
                O valor de cada explicação pode variar em função do tipo de aula e do número de participantes.
                As condições comerciais e os valores aplicáveis em cada momento devem ser consultados na secção{' '}
                <Link href="/marcar" className="font-semibold text-[#111111] underline underline-offset-4">
                  Explicações
                </Link>
                .
              </p>
              <p className="mt-3">
                No caso de aulas de grupo, a confirmação pode depender do cumprimento das condições de pagamento
                pelos vários participantes.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#000000] mb-3">5. Desmarcações e reembolsos</h2>
              <p>
                As regras de desmarcação, reagendamento, atrasos, problemas técnicos e reembolsos seguem as
                condições divulgadas na secção{' '}
                <Link href="/marcar/informacoes" className="font-semibold text-[#111111] underline underline-offset-4">
                  Informações
                </Link>
                , que faz parte integrante destes termos.
              </p>
              <p className="mt-3">Em particular, o reembolso pode ser admitido se se verificar uma das seguintes situações:</p>
              <ul className="mt-3 list-disc space-y-2 pl-6">
                <li>a aula não for realizada por não comparência do Alin;</li>
                <li>o aluno estiver insatisfeito por motivos relacionados unicamente com a explicação e com o Alin.</li>
              </ul>
              <p className="mt-3">Não haverá lugar a reembolso, nomeadamente, quando:</p>
              <ul className="mt-3 list-disc space-y-2 pl-6">
                <li>o aluno não comparecer à aula sem aviso prévio adequado;</li>
                <li>a aula já tiver sido realizada sem que tenham sido levantados problemas no momento adequado;</li>
                <li>os motivos invocados estiverem relacionados com o empenho, estudo ou esforço do aluno.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#000000] mb-3">6. Direitos e deveres do aluno</h2>
              <p>O aluno ou utilizador compromete-se a:</p>
              <ul className="mt-3 list-disc space-y-2 pl-6">
                <li>fornecer dados verdadeiros e atualizados;</li>
                <li>respeitar os horários agendados e avisar com antecedência quando não puder comparecer;</li>
                <li>utilizar o site e os materiais apenas para fins pessoais de estudo;</li>
                <li>não partilhar, vender, reproduzir ou distribuir conteúdos pagos ou exclusivos sem autorização;</li>
                <li>manter um comportamento respeitador nas explicações e nas comunicações realizadas através da plataforma.</li>
              </ul>
              <p className="mt-3">
                O aluno tem direito a receber informação clara sobre o serviço, os preços, as condições de
                marcação e os recursos disponibilizados, bem como a beneficiar das garantias legalmente aplicáveis.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#000000] mb-3">7. Compromissos da MatemáticaTop e do explicador</h2>
              <p>A MatemáticaTop e o explicador comprometem-se a:</p>
              <ul className="mt-3 list-disc space-y-2 pl-6">
                <li>prestar as explicações com diligência, pontualidade e boa-fé;</li>
                <li>organizar os serviços e materiais com o cuidado compatível com a natureza educativa do projeto;</li>
                <li>disponibilizar, sempre que aplicável, informação suficientemente clara sobre o funcionamento do serviço;</li>
                <li>atuar de forma respeitadora e adequada no acompanhamento do aluno.</li>
              </ul>
              <p className="mt-3">
                A MatemáticaTop pode atualizar funcionalidades, conteúdos, recursos ou métodos de organização do
                serviço, desde que tal não elimine direitos já adquiridos pelo utilizador.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#000000] mb-3">8. Não garantia de resultados</h2>
              <p>
                A MatemáticaTop procura prestar um acompanhamento sério e útil, mas não garante resultados
                escolares específicos, classificações mínimas, sucesso em testes ou aprovação em exame.
              </p>
              <p className="mt-3">
                O aproveitamento do aluno depende também de fatores que escapam ao controlo do explicador,
                incluindo assiduidade, empenho, estudo autónomo, preparação prévia, cumprimento das orientações
                dadas e contexto escolar.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#000000] mb-3">9. Conteúdos, materiais e propriedade intelectual</h2>
              <p>
                Os conteúdos disponibilizados na plataforma, incluindo textos, cronogramas, imagens, fichas,
                materiais de apoio, organização visual, vídeos e outros recursos, pertencem à MatemáticaTop ou
                são usados legitimamente no contexto do projeto.
              </p>
              <p className="mt-3">
                Salvo indicação em contrário, esses materiais destinam-se ao uso pessoal do aluno para fins de
                estudo. Não é permitida a sua reprodução, distribuição, revenda, disponibilização pública ou
                utilização comercial sem autorização prévia por escrito.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#000000] mb-3">10. Disponibilidade da plataforma</h2>
              <p>
                A MatemáticaTop procura assegurar o bom funcionamento do site, mas não garante que a plataforma
                esteja permanentemente disponível, sem interrupções, atrasos, erros técnicos ou incompatibilidades
                com todos os dispositivos e navegadores.
              </p>
              <p className="mt-3">
                Sempre que possível, serão tomadas medidas razoáveis para corrigir falhas, restaurar serviços e
                reduzir o impacto de problemas técnicos.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#000000] mb-3">11. Comunicações, newsletter e dados pessoais</h2>
              <p>
                A MatemáticaTop pode enviar emails relacionados com a conta, marcações, lembretes, alterações de
                serviço e, quando o utilizador o autorize, comunicações informativas ou newsletter.
              </p>
              <p className="mt-3">
                O tratamento de dados pessoais é efetuado na medida necessária à operação da plataforma, à gestão
                das explicações e à comunicação com o utilizador, sem prejuízo dos direitos legalmente reconhecidos
                em matéria de proteção de dados.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#000000] mb-3">12. Lei aplicável e direitos do consumidor</h2>
              <p>
                Estes termos devem ser interpretados de acordo com a legislação portuguesa aplicável. Nada do que
                aqui se encontra pretende limitar os direitos que a lei reconheça ao utilizador.
              </p>
              <p className="mt-3">
                Sempre que exista alguma dúvida de interpretação, deverá prevalecer a solução que melhor respeite
                a legislação aplicável ao serviço prestado.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#000000] mb-3">13. Reclamações e resolução de litígios</h2>
              <p>
                Qualquer questão, dificuldade ou reclamação deve ser comunicada preferencialmente através da secção{' '}
                <Link href="/contacto" className="font-semibold text-[#111111] underline underline-offset-4">
                  Contacto
                </Link>
                , para tentativa de resolução simples e amigável.
              </p>
              <p className="mt-3">
                Se não for possível resolver a situação por essa via, o utilizador poderá recorrer aos meios de
                reclamação ou resolução de litígios que lhe sejam legalmente disponíveis.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#000000] mb-3">14. Alterações aos termos</h2>
              <p>
                A MatemáticaTop pode atualizar estes termos para refletir alterações legais, melhorias do serviço,
                novas funcionalidades ou mudanças de funcionamento. A versão em vigor será sempre a que estiver
                publicada nesta página.
              </p>
            </section>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
