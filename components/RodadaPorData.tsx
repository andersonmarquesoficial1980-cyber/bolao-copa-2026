"use client"

import { useState } from "react"
import { GameCard } from "@/components/GameCard"
import { Game, Prediction } from "@/types"
import { formatDate } from "@/lib/utils"

interface OtherPrediction {
  palpite_casa: number
  palpite_fora: number
  profiles: { nome: string; avatar_url?: string } | null
}

interface RodadaPorDataProps {
  games: Game[]
  predictionMap: Map<string, Prediction>
  allPredictionsMap: Map<string, OtherPrediction[]>
  jaPagou: boolean
  corte13: Date
}

function dateLabel(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    timeZone: "America/Sao_Paulo",
  })
}

function dateDayKey(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    timeZone: "America/Sao_Paulo",
  })
}

export function RodadaPorData({ games, predictionMap, allPredictionsMap, jaPagou, corte13 }: RodadaPorDataProps) {
  // Agrupa jogos por dia
  const grouped = new Map<string, { label: string; games: Game[] }>()
  for (const game of games) {
    const key = dateDayKey(game.data_jogo)
    if (!grouped.has(key)) {
      grouped.set(key, { label: dateLabel(game.data_jogo), games: [] })
    }
    grouped.get(key)!.games.push(game)
  }

  const days = Array.from(grouped.entries())

  // Abre o dia mais próximo com jogos futuros por padrão
  const now = new Date()
  const firstOpenIndex = days.findIndex(([, { games }]) =>
    games.some(g => new Date(g.data_jogo) >= now || g.status === "live")
  )
  const [openDay, setOpenDay] = useState<string | null>(
    days[firstOpenIndex >= 0 ? firstOpenIndex : 0]?.[0] ?? null
  )

  return (
    <div className="space-y-3">
      {days.map(([key, { label, games: dayGames }]) => {
        const isOpen = openDay === key
        const hasLive = dayGames.some(g => g.status === "live")
        const allDone = dayGames.every(g => g.status === "finished")
        const myPalpites = dayGames.filter(g => predictionMap.has(g.id)).length

        return (
          <div key={key} className="rounded-xl border overflow-hidden">
            {/* Header do dia — clicável */}
            <button
              onClick={() => setOpenDay(isOpen ? null : key)}
              className="w-full flex items-center justify-between px-4 py-3 bg-[#1B3A8C] text-white hover:bg-[#15317a] transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold capitalize">{label}</span>
                {hasLive && <span className="text-xs bg-green-400 text-green-900 rounded-full px-2 py-0.5 font-semibold">AO VIVO</span>}
                {allDone && <span className="text-xs bg-zinc-300 text-zinc-700 rounded-full px-2 py-0.5">Encerrado</span>}
              </div>
              <div className="flex items-center gap-3 text-xs text-blue-200">
                <span>{myPalpites}/{dayGames.length} palpites</span>
                <span className="text-lg">{isOpen ? "▲" : "▼"}</span>
              </div>
            </button>

            {/* Jogos do dia */}
            {isOpen && (
              <div className="grid gap-4 p-4 md:grid-cols-2 bg-white">
                {dayGames.map(game => {
                  const bloqueado = !jaPagou && new Date(game.data_jogo) >= corte13
                  return (
                    <GameCard
                      key={game.id}
                      game={game}
                      prediction={predictionMap.get(game.id)}
                      otherPredictions={allPredictionsMap.get(game.id) || []}
                      bloqueadoPorPagamento={bloqueado}
                    />
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
