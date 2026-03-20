import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main className="pt-20 min-h-screen bg-[#f0f4f8] px-4 py-10">
        <section className="max-w-4xl mx-auto bg-white rounded-2xl shadow-md p-6 sm:p-8">
          <h1 className="text-3xl font-bold text-[#0d2f4a] mb-2">Termos de utilizador</h1>
          <p className="text-sm text-gray-500 mb-8">Última atualização: março de 2026</p>

          <div className="space-y-6 text-sm sm:text-base text-gray-700 leading-relaxed">
            <section>
              <h2 className="text-lg font-semibold text-[#0d2f4a] mb-2">1. Âmbito</h2>
              <p>
                Estes termos regulam o uso da plataforma Matemática é Top, incluindo marcações, cronogramas,
                conteúdos de apoio e comunicação com o utilizador.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#0d2f4a] mb-2">2. Conta do utilizador</h2>
              <p>
                O utilizador é responsável pelos dados fornecidos no registo e pela confidencialidade das
                credenciais de acesso.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#0d2f4a] mb-2">3. Utilização da plataforma</h2>
              <p>
                A plataforma destina-se exclusivamente a fins de estudo e preparação para Matemática. Não é
                permitido uso abusivo, tentativa de acesso indevido, ou partilha não autorizada de conteúdos.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#0d2f4a] mb-2">4. Marcações e pagamentos</h2>
              <p>
                As marcações ficam sujeitas à disponibilidade de horários. Em aulas pagas online, a confirmação
                depende da validação do pagamento.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#0d2f4a] mb-2">5. Comunicações por email</h2>
              <p>
                O utilizador pode optar por receber novidades por email no momento do registo. Esta preferência
                pode ser alterada posteriormente através de pedido de suporte.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#0d2f4a] mb-2">6. Proteção de dados</h2>
              <p>
                Os dados pessoais são tratados para operação da conta, gestão de marcações e comunicação
                necessária ao serviço.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#0d2f4a] mb-2">7. Alterações aos termos</h2>
              <p>
                Estes termos podem ser atualizados para refletir melhorias da plataforma, obrigações legais ou
                alterações de funcionamento.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#0d2f4a] mb-2">8. Contacto</h2>
              <p>
                Para esclarecimentos sobre estes termos, utiliza os canais de contacto disponíveis no site.
              </p>
            </section>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
