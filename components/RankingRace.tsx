"use client"

import { Score } from "@/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface RankingRaceProps {
  ranking: Score[]
}

const MEDALS = ["🥇", "🥈", "🥉"]
const TRACK_COLORS = [
  "bg-yellow-100 border-yellow-400",
  "bg-zinc-100 border-zinc-400",
  "bg-amber-100 border-amber-600",
  "bg-blue-50 border-blue-300",
  "bg-green-50 border-green-300",
]

export function RankingRace({ ranking }: RankingRaceProps) {
  if (!ranking.length) return null

  const maxPontos = ranking[0]?.total_pontos || 1

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-bold text-primary flex items-center gap-2">🏁 Corrida do Bolão</h2>
      <div className="space-y-2">
        {ranking.map((item, index) => {
          const pct = maxPontos > 0 ? Math.max(4, (item.total_pontos / maxPontos) * 100) : 4
          const trackColor = TRACK_COLORS[Math.min(index, TRACK_COLORS.length - 1)]
          const nome = item.profiles?.nome || "Participante"
          const initials = nome.slice(0, 2).toUpperCase()

          return (
            <div key={item.user_id} className={`relative rounded-xl border-2 ${trackColor} px-3 py-2 overflow-hidden`}>
              {/* Linha de chegada */}
              <div className="absolute right-0 top-0 bottom-0 w-8 flex items-center justify-center border-l-2 border-dashed border-gray-400 bg-white/60 z-10">
                <span className="text-xs text-gray-500 rotate-90 whitespace-nowrap">🏁</span>
              </div>

              {/* Pista */}
              <div className="flex items-center gap-2 relative z-0" style={{ paddingRight: "2rem" }}>
                {/* Posição */}
                <span className="text-lg w-7 text-center shrink-0">
                  {index < 3 ? MEDALS[index] : `${index + 1}º`}
                </span>

                {/* Barra de progresso com avatar */}
                <div className="flex-1 relative h-10">
                  {/* trilho */}
                  <div className="absolute inset-y-0 left-0 right-0 rounded-full bg-white/60 border border-gray-200" />
                  {/* progresso */}
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 opacity-30 transition-all duration-700"
                    style={{ width: `${pct}%` }}
                  />
                  {/* avatar na ponta */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-700"
                    style={{ left: `${pct}%` }}
                  >
                    <div className="relative">
                      <Avatar className="h-9 w-9 border-2 border-white shadow-md ring-2 ring-blue-400">
                        <AvatarImage src={item.profiles?.avatar_url} alt={nome} />
                        <AvatarFallback className="text-xs font-bold bg-blue-600 text-white">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      {/* mini carro */}
                      <span className="absolute -bottom-1 -right-1 text-base">⚽</span>
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div className="shrink-0 text-right min-w-[80px]">
                  <p className="text-sm font-semibold leading-tight truncate max-w-[80px]">{nome}</p>
                  <p className="text-xs text-muted-foreground">
                    <span className="font-bold text-primary">{item.total_pontos}</span> pts
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
