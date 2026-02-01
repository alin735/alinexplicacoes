"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Copy, Loader2 } from "lucide-react"

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState("")
  const [generatedCode, setGeneratedCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleGenerateCode = async () => {
    setLoading(true)
    setError("")
    setGeneratedCode("")

    try {
      const response = await fetch("/api/admin/generate-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminKey })
      })

      const data = await response.json()

      if (data.success) {
        setGeneratedCode(data.code)
      } else {
        setError(data.error || "Erro ao gerar código")
      }
    } catch (err) {
      setError("Erro ao conectar com a API")
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedCode)
    alert("Código copiado!")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-700 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Painel Admin - Gerar Códigos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Chave Admin</label>
            <Input
              type="password"
              placeholder="Sua chave secreta"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Definida no arquivo .env como ADMIN_SECRET_KEY
            </p>
          </div>

          <Button 
            onClick={handleGenerateCode}
            disabled={loading || !adminKey}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gerando...
              </>
            ) : (
              "Gerar Código"
            )}
          </Button>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {generatedCode && (
            <Alert className="bg-green-50 border-green-200">
              <AlertDescription className="space-y-2">
                <p className="font-semibold">Código gerado com sucesso!</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-white px-3 py-2 rounded text-lg font-mono tracking-wider">
                    {generatedCode}
                  </code>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={copyToClipboard}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Envie este código para o aluno que contactou você
                </p>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}