"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

interface Participante {
  id: string
  nome: string
  email: string
  avatar_url?: string
  pago: boolean
}

export function PagamentosClient({ participantes }: { participantes: Participante[] }) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [lista, setLista] = useState(participantes)

  async function acao(userId: string, tipo: "confirmar" | "cancelar") {
    setLoadingId(userId)
    try {
      const res = await fetch("/api/admin/confirmar-pagamento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, acao: tipo }),
      })
      const data = await res.json()
      if (data.ok) {
        setLista(prev => prev.map(p =>
          p.id === userId ? { ...p, pago: tipo === "confirmar" } : p
        ))
        router.refresh()
      } else {
        alert("Erro: " + (data.error || "Tente novamente"))
      }
    } catch {
      alert("Erro de conexão")
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className="grid gap-3">
      {lista.map(p => (
        <Card key={p.id} className={p.pago ? "border-green-300 bg-green-50" : ""}>
          <CardContent className="py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarImage src={p.avatar_url} />
                <AvatarFallback className="text-xs">{p.nome?.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-sm">{p.nome}</p>
                <p className="text-xs text-muted-foreground">{p.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {p.pago ? (
                <>
                  <Badge className="bg-green-500 text-white">✅ Pago</Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-500 text-xs h-7 border-red-200"
                    disabled={loadingId === p.id}
                    onClick={() => acao(p.id, "cancelar")}
                  >
                    {loadingId === p.id ? "..." : "Cancelar"}
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white"
                  disabled={loadingId === p.id}
                  onClick={() => acao(p.id, "confirmar")}
                >
                  {loadingId === p.id ? "Salvando..." : "✓ Confirmar PIX"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
