'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MathRain from '@/components/MathRain';

export default function InformacoesExplicacoesPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#f5f5f5]">
        <div className="relative overflow-hidden border-b border-black/15 bg-white px-4 pb-12 pt-32">
          <MathRain speed="fast" />
          <div className="relative z-10 mx-auto max-w-4xl text-center">
            <h1 className="mb-2 text-3xl font-bold text-[#000000] sm:text-4xl">
              Todas as informações sobre as explicações
            </h1>
            <p className="text-gray-600">
              Tudo o que precisa saber sobre as marcações e o funcionamento das aulas.
            </p>
          </div>
        </div>

        <div className="mx-auto grid max-w-4xl gap-6 px-4 py-10">
          <section className="rounded-2xl bg-white p-6 shadow-md">
            <h2 className="mb-4 text-xl font-bold text-[#000000]">Como fazer marcação</h2>
            <div className="space-y-2 text-sm leading-relaxed text-gray-700">
              <p>1) Escolhe no calendário o dia e a hora com vaga.</p>
              <p>2) Seleciona o ano e o tema de Matemática.</p>
              <p>3) Define se a aula é individual ou em grupo.</p>
              <p>4) Se for grupo, pede aos colegas o código na aba “Conta” e cola os códigos separados por vírgula.</p>
              <p>5) Opcionalmente, adiciona observações sobre o que queres melhorar.</p>
              <p>6) Confirma e avança para pagamento; em grupo, a marcação só fica concluída quando todos pagarem.</p>
            </div>
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-md">
            <h2 className="mb-4 text-xl font-bold text-[#000000]">Como funcionam as explicações</h2>
            <div className="space-y-3 text-sm leading-relaxed text-gray-700">
              <p>
                Depois de fazeres a marcação e efetuares o pagamento, manda uma mensagem ao Alin via chat do site ou comunidade do Discord para que ele possa entrar em contacto contigo para preparar a aula.
              </p>
              <p>
                A explicação é dada em chamada no Discord, em conjunto com a plataforma Miro. O Miro é uma ferramenta interativa onde também podes escrever durante a aula.
              </p>
              <p>
                Se tiveres um dispositivo que facilite essa escrita, melhor. Ainda assim, a explicação não fica comprometida se não o tiveres.
              </p>
              <p>
                Todos os materiais utilizados na aula ficam guardados na aba <strong>Minhas aulas</strong> no site.
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
                Se surgir algum imprevisto ou algum problema com a marcação, entra em contacto assim que possível para analisar a situação.
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-[#000000]/15 bg-white p-6 shadow-md">
            <h2 className="mb-4 text-xl font-bold text-[#000000]">Dúvidas e contactos</h2>
            <p className="text-sm text-gray-700">
              Em caso de dúvida, entra em contacto através do chat do site, do Discord ou das redes sociais.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
