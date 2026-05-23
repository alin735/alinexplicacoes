import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Termos de Devolução · Preparação Intensiva | MatemáticaTop',
  robots: { index: false },
};

export default function ReembolsoPage() {
  return (
    <>
      <Navbar />
      <main className="pt-24 pb-20 min-h-screen bg-[#f5f5f5] px-4">
        <div className="max-w-2xl mx-auto">

          <Link
            href="/preparacao"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#000000] transition-colors mb-10"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Voltar à preparação
          </Link>

          <h1 className="text-4xl font-black text-[#000000] mb-2">Termos de Devolução</h1>
          <p className="text-sm text-gray-400 mb-12">Preparação Intensiva · Exame de Matemática 9.º Ano 2026</p>

          <div className="space-y-8 text-gray-700 leading-relaxed">

            <section>
              <h2 className="text-lg font-black text-[#000000] mb-3">A quem se aplica</h2>
              <p>
                A garantia de satisfação aplica-se exclusivamente ao <strong className="text-[#000000]">Pacote Completo</strong>.
                Os Pacotes Intermédio e Aula Avulsa não estão abrangidos por esta política de devolução.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-black text-[#000000] mb-3">Prazo</h2>
              <p>
                O pedido de devolução deve ser feito <strong className="text-[#000000]">até ao final do programa</strong> (14 de junho de 2026),
                através dos contactos indicados abaixo.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-black text-[#000000] mb-3">Como pedir</h2>
              <p>
                Basta enviares uma mensagem através do <strong className="text-[#000000]">chat do site</strong> ou por email para{' '}
                <a href="mailto:matematica.top@gmail.com" className="text-[#5a7ca8] hover:underline font-medium">
                  matematica.top@gmail.com
                </a>{' '}
                com o assunto <em>"Pedido de reembolso"</em>. Não são pedidas justificações.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-black text-[#000000] mb-3">Processamento</h2>
              <p>
                O reembolso é processado no prazo de <strong className="text-[#000000]">5 dias úteis</strong> para o método de pagamento original (cartão ou MB Way).
              </p>
            </section>

            <div className="rounded-2xl border border-black/10 bg-white p-6 mt-10">
              <p className="text-sm text-gray-500">
                Tens dúvidas? Usa o chat aqui no site ou envia email para{' '}
                <a href="mailto:matematica.top@gmail.com" className="text-[#5a7ca8] hover:underline">
                  matematica.top@gmail.com
                </a>.
              </p>
            </div>

          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
