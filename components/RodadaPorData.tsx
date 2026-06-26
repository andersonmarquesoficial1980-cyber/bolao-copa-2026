"use client"

import { useState } from "react"
import { GameCard } from "@/components/GameCard"
import { Game, Prediction, Fase } from "@/types"

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
  groupFaseMap: Map<string, Fase> // group_id → fase
}

const FASE_LABEL: Record<Fase, string> = {
  grupo: "Fase de Grupos",
  oitavas: "Oitavas de Final",
  quartas: "Quartas de Final",
  semifinal: "Semifinal",
  terceiro_lugar: "3º Lugar",
  final: "Final",
}

const FASE_ORDER: Fase[] = ["grupo", "oitavas", "quartas", "semifinal", "terceiro_lugar", "final"]

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

export function RodadaPorData({ games, predictionMap, allPredictionsMap, jaPagou, corte13, groupFaseMap }: RodadaPorDataProps) {
  // Determinar a fase inicial: a mais próxima com jogos futuros ou ao vivo
  const now = new Date()

  function getFase(game: Game): Fase {
    if (game.group_id && groupFaseMap.has(game.group_id)) {
      return groupFaseMap.get(game.group_id)!
    }
    return "grupo"
  }

  // Fases que têm jogos
  const fasesComJogos = FASE_ORDER.filter(fase =>
    games.some(g => getFase(g) === fase)
  )

  // Fase inicial: primeira com jogo futuro ou ao vivo; fallback: última fase
  const faseInicial = fasesComJogos.find(fase =>
    games.some(g => getFase(g) === fase && (new Date(g.data_jogo) >= now || g.status === "live"))
  ) ?? fasesComJogos[fasesComJogos.length - 1] ?? "grupo"

  const [faseSel, setFaseSel] = useState<Fase>(faseInicial)

  // Jogos da fase selecionada
  const jogosDaFase = games.filter(g => getFase(g) === faseSel)

  // Agrupa por dia dentro da fase
  const grouped = new Map<string, { label: string; games: Game[] }>()
  for (const game of jogosDaFase) {
    const key = dateDayKey(game.data_jogo)
    if (!grouped.has(key)) {
      grouped.set(key, { label: dateLabel(game.data_jogo), games: [] })
    }
    grouped.get(key)!.games.push(game)
  }

  const days = Array.from(grouped.entries())

  // Dia aberto: primeiro com jogo futuro ou ao vivo
  const firstOpenIndex = days.findIndex(([, { games: dg }]) =>
    dg.some(g => new Date(g.data_jogo) >= now || g.status === "live")
  )
  const [openDay, setOpenDay] = useState<string | null>(
    days[firstOpenIndex >= 0 ? firstOpenIndex : 0]?.[0] ?? null
  )

  // Reset dia aberto ao trocar de fase
  function handleFase(fase: Fase) {
    setFaseSel(fase)
    const jogosNovaFase = games.filter(g => getFase(g) === fase)
    const gNovaFase = new Map<string, { label: string; games: Game[] }>()
    for (const game of jogosNovaFase) {
      const key = dateDayKey(game.data_jogo)
      if (!gNovaFase.has(key)) gNovaFase.set(key, { label: dateLabel(game.data_jogo), games: [] })
      gNovaFase.get(key)!.games.push(game)
    }
    const daysNova = Array.from(gNovaFase.entries())
    const idx = daysNova.findIndex(([, { games: dg }]) =>
      dg.some(g => new Date(g.data_jogo) >= now || g.status === "live")
    )
    setOpenDay(daysNova[idx >= 0 ? idx : 0]?.[0] ?? null)
  }

  return (
    <div className="space-y-4">
      {/* Abas de fase */}
      <div className="flex gap-1 flex-wrap border-b border-zinc-200 pb-2">
        {fasesComJogos.map(fase => {
          const hasLive = games.some(g => getFase(g) === fase && g.status === "live")
          return (
            <button
              key={fase}
              onClick={() => handleFase(fase)}
              className={`px-3 py-1.5 rounded-t-lg text-sm font-semibold transition-colors whitespace-nowrap ${
                faseSel === fase
                  ? "bg-[#1B3A8C] text-white"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              {FASE_LABEL[fase]}
              {hasLive && <span className="ml-1.5 inline-block w-2 h-2 rounded-full bg-green-400" />}
            </button>
          )
        })}
      </div>

      {/* Dias da fase selecionada */}
      <div className="space-y-3">
        {days.map(([key, { label, games: dayGames }]) => {
          const isOpen = openDay === key
          const hasLive = dayGames.some(g => g.status === "live")
          const allDone = dayGames.every(g => g.status === "finished")
          const myPalpites = dayGames.filter(g => predictionMap.has(g.id)).length

          return (
            <div key={key} className="rounded-xl border overflow-hidden">
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

        {days.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhum jogo nesta fase ainda.</p>
        )}
      </div>
    </div>
  )
}
