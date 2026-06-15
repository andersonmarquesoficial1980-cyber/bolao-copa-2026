"use client"

import { useState } from "react"
import { createSupabaseBrowserClient } from "@/lib/supabase-browser"
import { useRouter } from "next/navigation"
import Link from "next/link"

export function BannerCorrecao({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const supabase = createSupabaseBrowserClient()
  const router = useRouter()

  async function handleDismiss() {
    setLoading(true)
    await supabase.from("profiles").update({ correcao_lida: true }).eq("id", userId)
    setDismissed(true)
    setLoading(false)
    router.refresh()
  }

  if (dismissed) return null

  return (
    <div className="rounded-xl border border-yellow-400 bg-yellow-50 p-4 text-sm text-yellow-900 space-y-3">
      <div className="flex items-start gap-2">
        <span className="text-xl">⚠️</span>
        <div className="space-y-1">
          <p className="font-bold text-base">Correção de pontuação</p>
          <p>
            Identificamos um erro no cálculo de pontos dos jogos realizados até o dia 15/06.
            As pontuações foram recalculadas e a classificação foi atualizada.
          </p>
          <p>
            <Link
              href="/correcao"
              className="underline font-semibold text-yellow-800 hover:text-yellow-700"
            >
              Ver o resumo completo com seus palpites →
            </Link>
          </p>
        </div>
      </div>
      <div className="flex justify-end">
        <button
          onClick={handleDismiss}
          disabled={loading}
          className="rounded-lg bg-yellow-400 px-4 py-1.5 text-sm font-semibold text-yellow-900 hover:bg-yellow-500 disabled:opacity-50 transition"
        >
          {loading ? "Aguarde..." : "✓ Li e entendi"}
        </button>
      </div>
    </div>
  )
}
