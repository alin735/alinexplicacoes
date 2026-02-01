import { CardTitle } from "@/components/ui/card"
import { CardHeader } from "@/components/ui/card"
import { Card, CardContent } from "@/components/ui/card"

const benefits = [
  {
    title: "Explicações Claras e Eficazes",
    description:
      "O Alin tem uma abordagem que torna os conceitos mais complexos simples de entender. Cada explicação é adaptada ao teu ritmo e estilo de aprendizagem.",
  },
  {
    title: "Preocupação Genuína",
    description:
      "Mais do que um explicador, o Alin preocupa-se verdadeiramente com o teu progresso. Acompanha-te nas dificuldades e celebra contigo cada conquista.",
  },
  {
    title: "Foco nos Resultados",
    description:
      "O objetivo é claro: ajudar-te a alcançar a melhor nota possível. Com estratégias direcionadas e prática constante, vais superar as tuas expectativas.",
  },
]

export function BenefitsSection() {
  return (
    <section id="beneficios" className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Porquê estudar com o Alin?
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Descobre as vantagens de ter o Alin como explicador para a disciplina de Matemática.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 items-start">
          {benefits.map((benefit) => (
            <Card key={benefit.title} className="border-2 hover:border-primary/50 transition-colors h-full">
              <CardContent className="pt-6 text-center flex flex-col h-full">
                <h3 className="text-2xl font-semibold text-foreground mb-4 min-h-[4rem] flex items-center justify-center">{benefit.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {benefit.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
