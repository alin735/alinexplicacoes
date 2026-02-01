"use client"

import CodeValidator from "@/components/code-validator"
import React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Clock, Loader2, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Alert, AlertDescription } from "@/components/ui/alert"

const availableHours: Record<number, string[]> = {
  0: ["10:00", "11:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00"],
  1: ["18:00", "19:00", "20:00"],
  2: ["20:00"],
  3: ["15:00", "16:00", "17:00", "18:00", "19:00", "20:00"],
  4: ["20:00"],
  5: ["19:00", "20:00"],
  6: ["10:00", "11:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00"],
}

interface BookedSession {
  date: Date
  time: string
  id: string
}

export function BookingSection() {
  const [showCodeModal, setShowCodeModal] = useState(false)
  const [codeId, setCodeId] = useState<string | null>(null)
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [selectedTime, setSelectedTime] = useState<string | undefined>(undefined)
  const [bookedSessions, setBookedSessions] = useState<BookedSession[]>([])
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    schoolYear: "",
    hoursPerWeek: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const maxSessions = parseInt(formData.hoursPerWeek) || 0

  const handleCodeValidated = async (validatedCodeId: string) => {
    setCodeId(validatedCodeId)
    setShowCodeModal(false)
    
    await submitBookings(validatedCodeId)
  }

  const submitBookings = async (validatedCodeId: string) => {
    setLoading(true)
    setError("")

    try {
      const promises = bookedSessions.map(session => {
        const [hours, minutes] = session.time.split(':')
        const bookingDateTime = new Date(session.date)
        bookingDateTime.setHours(parseInt(hours), parseInt(minutes))

        return fetch("/api/bookings/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            schoolYear: formData.schoolYear,
            hoursPerWeek: formData.hoursPerWeek,
            date: bookingDateTime.toISOString(),
            codeId: validatedCodeId
          })
        })
      })

      const results = await Promise.all(promises)
      const allSuccessful = results.every(r => r.ok)

      if (allSuccessful) {
        alert(`✅ ${bookedSessions.length} marcação(ões) criada(s) com sucesso! Receberá emails de lembrete antes de cada sessão.`)
        setFormData({ name: "", email: "", schoolYear: "", hoursPerWeek: "" })
        setDate(undefined)
        setSelectedTime(undefined)
        setBookedSessions([])
      } else {
        setError("Erro ao criar algumas marcações")
      }
    } catch (err) {
      setError("Erro ao criar marcações. Tente novamente.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddSession = () => {
    if (!date || !selectedTime) {
      setError("Selecione uma data e hora")
      return
    }

    if (bookedSessions.length >= maxSessions) {
      setError(`Você já marcou ${maxSessions} sessão(ões). Remova uma para adicionar outra.`)
      return
    }

    const alreadyBooked = bookedSessions.some(
      session => 
        session.date.toDateString() === date.toDateString() && 
        session.time === selectedTime
    )

    if (alreadyBooked) {
      setError("Esta data e hora já foram selecionadas")
      return
    }

    const newSession: BookedSession = {
      date: date,
      time: selectedTime,
      id: `${date.toISOString()}-${selectedTime}`
    }

    setBookedSessions([...bookedSessions, newSession])
    setSelectedTime(undefined)
    setError("")
  }

  const handleRemoveSession = (sessionId: string) => {
    setBookedSessions(bookedSessions.filter(s => s.id !== sessionId))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (bookedSessions.length === 0) {
      setError("Por favor, adicione pelo menos uma sessão")
      return
    }

    if (bookedSessions.length !== maxSessions) {
      setError(`Você selecionou ${formData.hoursPerWeek} horas por semana. Por favor, marque ${maxSessions} sessão(ões).`)
      return
    }

    if (!formData.name || !formData.email || !formData.schoolYear || !formData.hoursPerWeek) {
      setError("Por favor, preencha todos os campos")
      return
    }

    setShowCodeModal(true)
  }

  const getAvailableHoursForDate = (selectedDate: Date | undefined) => {
    if (!selectedDate) return []
    const dayOfWeek = selectedDate.getDay()
    return availableHours[dayOfWeek] || []
  }

  const handleDateSelect = (newDate: Date | undefined) => {
    setDate(newDate)
    setSelectedTime(undefined)
  }

  const hoursForSelectedDate = getAvailableHoursForDate(date)

  const getDayName = (date: Date) => {
    const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
    return days[date.getDay()]
  }

  return (
    <>
      {showCodeModal && (
        <CodeValidator onCodeValidated={handleCodeValidated} />
      )}
      
      <section id="reservar" className="py-16 md:py-24 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Precisas de ir mais além?
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              As aulas de Matemática na escola nem sempre são suficientes para alcançar a nota que desejas. 
              Com o Alin, terás um acompanhamento personalizado que te ajuda a compreender a matéria melhor 
              e preparar-te para os testes com confiança.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Reserva a tua sessão</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome</Label>
                    <Input
                      id="name"
                      placeholder="O teu nome completo"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="o-teu-email@exemplo.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="schoolYear">Ano escolar</Label>
                    <Select
                      value={formData.schoolYear}
                      onValueChange={(value) => setFormData({ ...formData, schoolYear: value })}
                      required
                    >
                      <SelectTrigger id="schoolYear">
                        <SelectValue placeholder="Seleciona o ano" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1.º ano</SelectItem>
                        <SelectItem value="2">2.º ano</SelectItem>
                        <SelectItem value="3">3.º ano</SelectItem>
                        <SelectItem value="4">4.º ano</SelectItem>
                        <SelectItem value="5">5.º ano</SelectItem>
                        <SelectItem value="6">6.º ano</SelectItem>
                        <SelectItem value="7">7.º ano</SelectItem>
                        <SelectItem value="8">8.º ano</SelectItem>
                        <SelectItem value="9">9.º ano</SelectItem>
                        <SelectItem value="10">10.º ano</SelectItem>
                        <SelectItem value="11">11.º ano</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hoursPerWeek">Número de horas por semana</Label>
                    <Select
                      value={formData.hoursPerWeek}
                      onValueChange={(value) => {
                        setFormData({ ...formData, hoursPerWeek: value })
                        setBookedSessions([])
                      }}
                      required
                    >
                      <SelectTrigger id="hoursPerWeek">
                        <SelectValue placeholder="Horas semanais" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 hora</SelectItem>
                        <SelectItem value="2">2 horas</SelectItem>
                        <SelectItem value="3">3 horas</SelectItem>
                        <SelectItem value="4">4 horas</SelectItem>
                        <SelectItem value="5">5 horas</SelectItem>
                      </SelectContent>
                    </Select>
                    {maxSessions > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Marcadas: {bookedSessions.length} de {maxSessions} sessões
                      </p>
                    )}
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full mt-6" 
                    disabled={loading || bookedSessions.length === 0}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        A processar...
                      </>
                    ) : (
                      "Fazer a marcação"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Escolhe a data e hora</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Calendário */}
                  <div className="flex justify-center">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={handleDateSelect}
                      className="rounded-md border"
                      disabled={(date) => date < new Date()}
                    />
                  </div>
                  
                  {/* Horas disponíveis */}
                  {date && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <Clock className="h-4 w-4" />
                        <span>Horas disponíveis</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {hoursForSelectedDate.length > 0 ? (
                          hoursForSelectedDate.map((time) => (
                            <button
                              key={time}
                              type="button"
                              onClick={() => setSelectedTime(time)}
                              className={cn(
                                "px-3 py-2 text-sm rounded-md border transition-colors",
                                selectedTime === time
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "bg-background hover:bg-muted border-border"
                              )}
                            >
                              {time}
                            </button>
                          ))
                        ) : (
                          <p className="col-span-3 text-sm text-muted-foreground text-center">
                            Sem disponibilidade neste dia.
                          </p>
                        )}
                      </div>
                      {selectedTime && (
                        <Button
                          type="button"
                          onClick={handleAddSession}
                          className="w-full"
                          size="sm"
                          disabled={bookedSessions.length >= maxSessions}
                        >
                          Adicionar: {getDayName(date)} às {selectedTime}
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Lista de sessões marcadas */}
                  {bookedSessions.length > 0 && (
                    <div className="border-t pt-4">
                      <h3 className="font-medium mb-3 text-sm">Explicações marcadas:</h3>
                      <div className="space-y-2">
                        {bookedSessions.map((session) => (
                          <div
                            key={session.id}
                            className="flex items-center justify-between bg-muted p-2.5 rounded-md text-sm"
                          >
                            <span>
                              <strong>{getDayName(session.date)}</strong>, {session.date.toLocaleDateString('pt-PT')} às {session.time}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveSession(session.id)}
                              className="h-7 w-7 p-0"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contacto para código de acesso */}
          <div className="text-center mt-12 max-w-2xl mx-auto">
            <p className="text-sm text-muted-foreground mb-3">
              Entre em contacto para obter o seu código de acesso.
            </p>
            <a 
              href="https://discord.gg/HHKNKSYFnh" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
            >
              Fale connosco no Discord
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
      </section>
    </>
  )
}
