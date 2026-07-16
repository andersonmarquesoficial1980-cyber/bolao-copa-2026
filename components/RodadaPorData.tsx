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
  groupFaseMap: Map<string, Fase>
  groupNomeMap?: Map<string, string>
}

const FASE_CONFIG: Record<Fase, { label: string; emoji: string; desc: string; gradient: string }> = {
  grupo:          { label: "Fase de Grupos",   emoji: "⚽", desc: "48 seleções, 12 grupos",         gradient: "from-[#1B3A8C] to-[#2d5fd4]" },
  oitavas:        { label: "Segunda Fase",      emoji: "🔥", desc: "32 seleções, fase eliminatória",  gradient: "from-[#0f6e3a] to-[#1aad5c]" },
  quartas:        { label: "Oitavas de Final",  emoji: "⚡", desc: "16 seleções, mata-mata",          gradient: "from-[#7c2d12] to-[#ea580c]" },
  semifinal:      { label: "Quartas de Final",  emoji: "🔥", desc: "8 seleções, grandes duelos",     gradient: "from-[#4c1d95] to-[#7c3aed]" },
  terceiro_lugar: { label: "3º Lugar",          emoji: "🥉", desc: "Disputa pelo bronze",            gradient: "from-[#374151] to-[#6b7280]" },
  final:          { label: "Semifinal",         emoji: "🏆", desc: "4 seleções, semifinal da Copa",     gradient: "from-[#92400e] to-[#f59e0b]" },
}

// Override por nome de grupo (quando fase é reutilizada ex: terceiro_lugar para Final)
const GRUPO_NOME_OVERRIDE: Record<string, { label: string; emoji: string; desc: string; gradient: string }> = {
  "Final":    { label: "Final",    emoji: "👑", desc: "A grande final da Copa do Mundo",  gradient: "from-[#b45309] to-[#f59e0b]" },
  "3º Lugar": { label: "3º Lugar", emoji: "🥉", desc: "Disputa pelo bronze",              gradient: "from-[#374151] to-[#6b7280]" },
}

const FASE_ORDER: Fase[] = ["grupo", "oitavas", "quartas", "semifinal", "final", "terceiro_lugar"]
// Ordem dos grupos nomeados dentro de terceiro_lugar
const GRUPO_NOME_ORDER = ["3º Lugar", "Final"]

function dateLabel(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    weekday: "long", day: "2-digit", month: "2-digit",
    timeZone: "America/Sao_Paulo",
  })
}

function dateDayKey(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    timeZone: "America/Sao_Paulo",
  })
}

export function RodadaPorData({ games, predictionMap, allPredictionsMap, jaPagou, corte13, groupFaseMap, groupNomeMap }: RodadaPorDataProps) {
  const now = new Date()

  function getFase(game: Game): Fase {
    if (game.group_id && groupFaseMap.has(game.group_id)) return groupFaseMap.get(game.group_id)!
    return "grupo"
  }

  function getGroupNome(game: Game): string {
    return (game.group_id && groupNomeMap?.get(game.group_id)) || ""
  }

  // Chave única de agrupamento: usa groupNome quando fase é terceiro_lugar
  function grupoKey(game: Game): string {
    const fase = getFase(game)
    if (fase === "terceiro_lugar") {
      const nome = getGroupNome(game)
      return nome ? `terceiro_lugar:${nome}` : "terceiro_lugar"
    }
    return fase
  }

  // Construir lista ordenada de grupos presentes
  const gruposPresentes: string[] = []
  for (const fase of FASE_ORDER) {
    if (fase === "terceiro_lugar") {
      // Expandir por nome de grupo, na ordem GRUPO_NOME_ORDER
      for (const nome of GRUPO_NOME_ORDER) {
        const key = `terceiro_lugar:${nome}`
        if (games.some(g => grupoKey(g) === key) && !gruposPresentes.includes(key)) {
          gruposPresentes.push(key)
        }
      }
      // Fallback: terceiro_lugar sem nome
      if (games.some(g => grupoKey(g) === "terceiro_lugar") && !gruposPresentes.includes("terceiro_lugar")) {
        gruposPresentes.push("terceiro_lugar")
      }
    } else {
      if (games.some(g => grupoKey(g) === fase)) gruposPresentes.push(fase)
    }
  }

  function getCfgByKey(key: string, sample: Game): { label: string; emoji: string; desc: string; gradient: string } {
    if (key.startsWith("terceiro_lugar:")) {
      const nome = key.split(":")[1]
      return GRUPO_NOME_OVERRIDE[nome] ?? FASE_CONFIG["terceiro_lugar"]
    }
    return FASE_CONFIG[key as Fase]
  }

  const [grupoAberto, setGrupoAberto] = useState<string | null>(null)
  const [openDay, setOpenDay] = useState<string | null>(null)

  function handleGrupoClick(key: string) {
    if (grupoAberto === key) { setGrupoAberto(null); return }
    setGrupoAberto(key)
    const jogosDaFase = games.filter(g => grupoKey(g) === key)
    const grouped = new Map<string, Game[]>()
    for (const g of jogosDaFase) {
      const k = dateDayKey(g.data_jogo)
      grouped.set(k, [...(grouped.get(k) || []), g])
    }
    const days = Array.from(grouped.entries())
    const idx = days.findIndex(([, dg]) => dg.some(g => new Date(g.data_jogo) >= now || g.status === "live"))
    setOpenDay(days[idx >= 0 ? idx : 0]?.[0] ?? null)
  }

  return (
    <div className="space-y-4">
      {gruposPresentes.map(grupoK => {
        const jogosDaFase = games.filter(g => grupoKey(g) === grupoK)
        const cfg = getCfgByKey(grupoK, jogosDaFase[0])
        const isOpen = grupoAberto === grupoK
        const hasLive = jogosDaFase.some(g => g.status === "live")
        const totalJogos = jogosDaFase.length
        const meusPalpites = jogosDaFase.filter(g => predictionMap.has(g.id)).length
        const concluidos = jogosDaFase.filter(g => g.status === "finished").length

        // Agrupar por dia dentro do grupo
        const grouped = new Map<string, { label: string; games: Game[] }>()
        for (const game of jogosDaFase) {
          const key = dateDayKey(game.data_jogo)
          if (!grouped.has(key)) grouped.set(key, { label: dateLabel(game.data_jogo), games: [] })
          grouped.get(key)!.games.push(game)
        }
        const days = Array.from(grouped.entries())

        return (
          <div key={grupoK} className="rounded-2xl overflow-hidden shadow-lg">
            {/* Card do grupo — clicável */}
            <button
              onClick={() => handleGrupoClick(grupoK)}
              className={`w-full bg-gradient-to-r ${cfg.gradient} text-white px-5 py-4 flex items-center justify-between transition-all hover:brightness-110`}
            >
              <div className="flex items-center gap-4">
                <span className="text-3xl">{cfg.emoji}</span>
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg">{cfg.label}</span>
                    {hasLive && (
                      <span className="flex items-center gap-1 text-xs bg-green-400 text-green-900 rounded-full px-2 py-0.5 font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-800 animate-pulse inline-block" />
                        AO VIVO
                      </span>
                    )}
                  </div>
                  <span className="text-sm opacity-80">{cfg.desc}</span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-right">
                <div className="text-xs opacity-80 hidden sm:block">
                  <div>{meusPalpites}/{totalJogos} palpites</div>
                  <div>{concluidos} encerrados</div>
                </div>
                <span className="text-2xl transition-transform duration-200" style={{ display: "inline-block", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
                  ▼
                </span>
              </div>
            </button>

            {/* Jogos da fase */}
            {isOpen && (
              <div className="bg-zinc-50 border-x border-b border-zinc-200 rounded-b-2xl divide-y divide-zinc-200">
                {days.map(([key, { label, games: dayGames }]) => {
                  const isDayOpen = openDay === key
                  const hasLiveDay = dayGames.some(g => g.status === "live")
                  const allDoneDay = dayGames.every(g => g.status === "finished")
                  const myPalpites = dayGames.filter(g => predictionMap.has(g.id)).length

                  return (
                    <div key={key}>
                      {/* Header do dia */}
                      <button
                        onClick={() => setOpenDay(isDayOpen ? null : key)}
                        className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-zinc-50 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold capitalize text-zinc-700">{label}</span>
                          {hasLiveDay && <span className="text-xs bg-green-100 text-green-700 rounded-full px-2 py-0.5 font-semibold">AO VIVO</span>}
                          {allDoneDay && <span className="text-xs bg-zinc-100 text-zinc-500 rounded-full px-2 py-0.5">Encerrado</span>}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-zinc-500">
                          <span>{myPalpites}/{dayGames.length} palpites</span>
                          <span className="text-base">{isDayOpen ? "▲" : "▼"}</span>
                        </div>
                      </button>

                      {/* Jogos do dia */}
                      {isDayOpen && (
                        <div className="grid gap-4 p-4 md:grid-cols-2 bg-white border-t border-zinc-100">
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
            )}
          </div>
        )
      })}
    </div>
  )
}
