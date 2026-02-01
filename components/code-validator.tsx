"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, XCircle } from "lucide-react"

interface CodeValidatorProps {
  onCodeValidated: (codeId: string) => void
}

export default function CodeValidator({ onCodeValidated }: CodeValidatorProps) {
  const [open, setOpen] = useState(true)
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleValidateCode = async () => {
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/validate-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim().toUpperCase() })
      })

      const data = await response.json()

      if (data.valid) {
        onCodeValidated(data.codeId)
        setOpen(false)
      } else {
        setError(data.message || "Código inválido")
      }
    } catch (err) {
      setError("Erro ao validar código. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Código de Acesso Necessário</DialogTitle>
          <DialogDescription>
            Para fazer uma marcação, precisa de um código de acesso. 
            Entre em contacto connosco primeiro para obter o seu código.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="code">Código de Acesso</Label>
            <Input
              id="code"
              placeholder="Ex: A1B2C3D4"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              maxLength={8}
              className="uppercase text-center text-lg tracking-widest font-mono"
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button 
            onClick={handleValidateCode} 
            disabled={loading || code.length < 8}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                A validar...
              </>
            ) : (
              "Validar Código"
            )}
          </Button>

          <p className="text-sm text-muted-foreground text-center">
            Não tem código? Entre em contacto connosco.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}