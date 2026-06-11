"use client"

import { useEffect, useState, useCallback } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface Participante {
  user_id: string
  nome: string
  avatar_url?: string
  pontos_fixos: number         // pontos de jogos já finalizados
  palpites: { game_id: string; palpite_casa: number; palpite_fora: number }[]
}

interface JogoAoVivo {
  home_pt: string
  away_pt: string
  placar_casa: number
  placar_fora: number
  state: string
  descricao: string
  minuto: number
  completo: boolean
}

interface JogoBanco {
  id: string
  time_casa: string
  time_fora: string
  status: string
}

interface Props {
  participantes: Participante[]
  jogosBanco: JogoBanco[]
}

function calcularPontosProvisórios(
  participante: Participante,
  jogosAoVivo: JogoAoVivo[],
  jogosBanco: JogoBanco[]
): number {
  let bonus = 0

  for (const palpite of participante.palpites) {
    const jogo = jogosBanco.find(j => j.id === palpite.game_id)
    if (!jogo || jogo.status === "finished") continue // já contabilizado nos fixos

    const aoVivo = jogosAoVivo.find(j =>
      (j.home_pt === jogo.time_casa && j.away_pt === jogo.time_fora) ||
      (j.home_pt === jogo.time_fora && j.away_pt === jogo.time_casa)
    )
    if (!aoVivo || aoVivo.state !== "in") continue

    const invertido = aoVivo.home_pt === jogo.time_fora
    const placarCasa = invertido ? aoVivo.placar_fora : aoVivo.placar_casa
    const placarFora = invertido ? aoVivo.placar_casa : aoVivo.placar_fora

    if (palpite.palpite_casa === placarCasa && palpite.palpite_fora === placarFora) {
      bonus += 3
    } else if (Math.sign(palpite.palpite_casa - palpite.palpite_fora) === Math.sign(placarCasa - placarFora)) {
      bonus += 1
    }
  }

  return participante.pontos_fixos + bonus
}

const MEDALS = ["🥇", "🥈"]

export function RankingAoVivo({ participantes, jogosBanco }: Props) {
  const [jogosAoVivo, setJogosAoVivo] = useState<JogoAoVivo[]>([])
  const [jogoAtual, setJogoAtual] = useState<JogoAoVivo | null>(null)
  const [ranking, setRanking] = useState(participantes.map(p => ({ ...p, total: p.pontos_fixos })))
  const [lastUpdate, setLastUpdate] = useState("")

  const buscarPlacar = useCallback(async () => {
    try {
      const res = await fetch("/api/placar-ao-vivo")
      const data = await res.json()
      const vivos: JogoAoVivo[] = data.jogos || []
      setJogosAoVivo(vivos)

      const emAndamento = vivos.find(j => j.state === "in")
      setJogoAtual(emAndamento || null)

      // Recalcula ranking com pontos provisórios
      const novo = participantes.map(p => ({
        ...p,
        total: calcularPontosProvisórios(p, vivos, jogosBanco),
      })).sort((a, b) => b.total - a.total || b.pontos_fixos - a.pontos_fixos)

      setRanking(novo)
      setLastUpdate(new Date().toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo" }))
    } catch { /* silent */ }
  }, [participantes, jogosBanco])

  useEffect(() => {
    buscarPlacar()
    const interval = setInterval(buscarPlacar, 30000) // atualiza a cada 30s
    return () => clearInterval(interval)
  }, [buscarPlacar])

  const maxPontos = Math.max(...ranking.map(r => r.total), 1)
  const temJogoAoVivo = !!jogoAtual

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-primary flex items-center gap-2">
          🏁 Corrida do Bolão
          {temJogoAoVivo && (
            <span className="text-xs bg-green-500 text-white rounded-full px-2 py-0.5 animate-pulse">AO VIVO</span>
          )}
        </h2>
        {lastUpdate && <span className="text-xs text-muted-foreground">Atualizado {lastUpdate}</span>}
      </div>

      {/* Jogo em andamento */}
      {jogoAtual && (
        <div className="rounded-lg bg-green-50 border border-green-300 px-4 py-2 flex items-center justify-between text-sm">
          <span className="font-medium">{jogoAtual.home_pt} × {jogoAtual.away_pt}</span>
          <span className="text-2xl font-black text-green-700">{jogoAtual.placar_casa} – {jogoAtual.placar_fora}</span>
          <span className="text-xs text-green-600">{jogoAtual.descricao}</span>
        </div>
      )}

      {/* Corrida */}
      <div className="space-y-2">
        {ranking.map((item, index) => {
          const pct = Math.max(4, (item.total / maxPontos) * 100)
          const nome = item.nome || "?"
          const initials = nome.slice(0, 2).toUpperCase()
          const trackColor = index === 0
            ? "bg-yellow-50 border-yellow-400"
            : index === 1
            ? "bg-zinc-50 border-zinc-400"
            : "bg-blue-50 border-blue-200"

          return (
            <div key={item.user_id} className={`relative rounded-xl border-2 ${trackColor} px-3 py-2 overflow-hidden`}>
              <div className="absolute right-0 top-0 bottom-0 w-8 flex items-center justify-center border-l-2 border-dashed border-gray-300 bg-white/60 z-10">
                <span className="text-xs text-gray-400 rotate-90 whitespace-nowrap">🏁</span>
              </div>

              <div className="flex items-center gap-2 relative z-0 pr-8">
                <span className="text-lg w-7 text-center shrink-0">
                  {index < 2 ? MEDALS[index] : `${index + 1}º`}
                </span>

                <div className="flex-1 relative h-10">
                  <div className="absolute inset-y-0 left-0 right-0 rounded-full bg-white/60 border border-gray-200" />
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 opacity-30 transition-all duration-1000"
                    style={{ width: `${pct}%` }}
                  />
                  <div
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-1000"
                    style={{ left: `${pct}%` }}
                  >
                    <div className="relative">
                      <Avatar className="h-9 w-9 border-2 border-white shadow-md ring-2 ring-blue-400">
                        <AvatarFallback className="text-xs font-bold bg-blue-600 text-white">{initials}</AvatarFallback>
                      </Avatar>
                      <span className="absolute -bottom-1 -right-1 text-sm">⚽</span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 text-right min-w-[80px]">
                  <p className="text-sm font-semibold leading-tight truncate max-w-[80px]">{nome}</p>
                  <p className="text-xs text-muted-foreground">
                    <span className="font-bold text-primary">{item.total}</span> pts
                    {item.total !== item.pontos_fixos && (
                      <span className="text-green-600 ml-1">(+{item.total - item.pontos_fixos} prov.)</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {temJogoAoVivo && (
        <p className="text-xs text-center text-muted-foreground">
          ⚡ Pontos provisórios em verde — atualiza a cada 30 segundos
        </p>
      )}
    </div>
  )
}
