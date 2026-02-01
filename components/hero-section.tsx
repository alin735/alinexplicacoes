'use client';

import React from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export function HeroSection() {
  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    const element = document.querySelector('#reservar')
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <section id="inicio" className="pt-24 pb-16 md:pt-32 md:pb-24 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight text-balance">
            Aprende Matemática com o Alin
          </h1>
          <div className="space-y-1">
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
              Explicações personalizadas para ti.
            </p>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
              Acompanhamento focado nos teus objetivos e resultados que fazem a diferença.
            </p>
          </div>
          <div className="flex justify-center pt-4">
            <Button size="lg" asChild className="gap-2">
              <a href="#reservar" onClick={handleSmoothScroll}>
                Marcar uma Explicação
                <ArrowRight className="h-5 w-5" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
