import { Users } from "lucide-react"

export function AboutSection() {
  return (
    <section id="detalhes" className="py-16 md:py-24 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4">
            <Users className="h-8 w-8" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Um projeto de aluno para alunos
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Este site nasceu de um projeto da disciplina de matemática do 11º ano, com o objetivo de criar uma ferramenta de estudo para melhorar o seu desempenho na disciplina.
          </p>
        </div>
      </div>
    </section>
  )
}
