"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

interface BotaoPagamentoProps {
  userId: string
  nome: string
  email: string
  jaPagou: boolean
}

export function BotaoPagamento({ userId, nome, email, jaPagou }: BotaoPagamentoProps) {
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState("")

  if (jaPagou) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
        ✅ Inscrição confirmada
      </span>
    )
  }

  async function pagar() {
    setLoading(true)
    setErro("")
    try {
      const res = await fetch("/api/pagamento/criar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, nomeParticipante: nome, email }),
      })
      const data = await res.json()
      if (data.init_point) {
        window.location.href = data.init_point
      } else {
        setErro(data.error || "Erro ao gerar link de pagamento")
      }
    } catch {
      setErro("Erro de conexão")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-1">
      <Button onClick={pagar} disabled={loading} className="bg-[#009EE3] hover:bg-[#007ab5] text-white">
        {loading ? "Aguarde..." : "💳 Pagar inscrição R$ 20,00"}
      </Button>
      {erro && <p className="text-xs text-red-600">{erro}</p>}
    </div>
  )
}
