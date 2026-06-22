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

    // Só considera jogos ao vivo que batem com ESTE jogo específico (evita pegar jogo errado com mesmo time)
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

function traduzirStatus(descricao: string, minuto: number): string {
  const d = descricao.toLowerCase()
  if (d.includes("first half") || d.includes("1st half")) return `1º Tempo${minuto > 0 ? ` · ${minuto}'` : ""}`
  if (d.includes("second half") || d.includes("2nd half")) return `2º Tempo${minuto > 0 ? ` · ${minuto}'` : ""}`
  if (d.includes("halftime") || d.includes("half time")) return "Intervalo"
  if (d.includes("extra time") || d.includes("overtime")) return `Prorrogação${minuto > 0 ? ` · ${minuto}'` : ""}`
  if (d.includes("penalty")) return "Pênaltis"
  if (d.includes("in progress") || d.includes("in play")) return `Em andamento${minuto > 0 ? ` · ${minuto}'` : ""}`
  if (d.includes("full time") || d.includes("final")) return "Encerrado"
  return descricao // fallback: mostra original
}

const MEDALS = ["🥇", "🥈"]

export function RankingAoVivo({ participantes, jogosBanco }: Props) {
  const [jogosAoVivo, setJogosAoVivo] = useState<JogoAoVivo[]>([])
  const [jogoAtual, setJogoAtual] = useState<JogoAoVivo | null>(null)
  const [ranking, setRanking] = useState(participantes.map(p => ({ ...p, total: p.pontos_fixos })))
  const [lastUpdate, setLastUpdate] = useState("")

  const buscarPlacar = useCallback(async () => {
    try {
      const res = await fetch(`/api/placar-ao-vivo?t=${Date.now()}`, { cache: "no-store" })
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
    buscarPlacar() // busca imediatamente no mount
    const interval = setInterval(buscarPlacar, 30000)
    return () => clearInterval(interval)
  }, [buscarPlacar])

  // Ordena ranking por total (pontos fixos + provisórios)
  const rankingOrdenado = [...ranking].sort((a, b) => b.total - a.total || b.pontos_fixos - a.pontos_fixos)
  const maxPontos = Math.max(...rankingOrdenado.map(r => r.total), 1)
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
          <span className="text-xs text-green-600">{traduzirStatus(jogoAtual.descricao, jogoAtual.minuto)}</span>
        </div>
      )}

      {/* Corrida */}
      <div className="space-y-2">
        {rankingOrdenado.map((item, index) => {
          // Posição: 1º grupo de empate = 1º, próximo grupo = 2º, etc.
          const grupos = rankingOrdenado.reduce<number[][]>((acc, r, i) => {
            if (i === 0 || r.total !== rankingOrdenado[i-1].total) acc.push([])
            acc[acc.length-1].push(i)
            return acc
          }, [])
          const posicao = grupos.findIndex(g => g.includes(index)) + 1

          const pct = Math.max(4, (item.total / maxPontos) * 100)
          const nome = item.nome || "?"
          const initials = nome.slice(0, 2).toUpperCase()
          const trackColor = posicao === 1
            ? "bg-yellow-50 border-yellow-400"
            : posicao === 2
            ? "bg-zinc-50 border-zinc-400"
            : "bg-blue-50 border-blue-200"

          return (
            <div key={item.user_id} className={`rounded-xl border-2 ${trackColor} px-3 py-2`}>
              {/* Linha: posição + avatar + nome + pontos */}
              <div className="flex items-center gap-2">
                <span className="text-base w-6 text-center shrink-0 font-bold">
                  {posicao === 1 ? MEDALS[0] : posicao === 2 ? MEDALS[1] : `${posicao}º`}
                </span>
                <Avatar className="h-8 w-8 shrink-0 border-2 border-white shadow ring-2 ring-blue-300">
                  <AvatarImage src={item.avatar_url || undefined} alt={nome} />
                  <AvatarFallback className="text-xs font-bold bg-blue-600 text-white">{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{nome}</p>
                </div>
                <p className="text-xs text-muted-foreground shrink-0 text-right">
                  <span className="font-bold text-primary">{item.total}</span> pts
                  {item.total !== item.pontos_fixos && (
                    <span className="text-green-600 ml-1 block">(+{item.total - item.pontos_fixos} prov.)</span>
                  )}
                </p>
              </div>

              {/* Pista: carrinho percorre barra de progresso até a bandeira */}
              <div className="flex items-center gap-1 mt-1.5">
                {/* Barra + carrinho */}
                <div className="flex-1 relative h-5 bg-gray-100 rounded-full border border-gray-200 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-400 to-blue-500 transition-all duration-1000"
                    style={{ width: `${pct}%` }}
                  />
                  {/* Carrinho na ponta da barra — dentro mas sem sair */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-full transition-all duration-1000 text-base leading-none"
                    style={{ left: `${Math.min(pct, 94)}%`, transform: "translateX(-100%) translateY(-50%) scaleX(-1)", filter: posicao === 1 ? "drop-shadow(0 0 3px gold)" : undefined }}
                  >
                    🏎️
                  </div>
                </div>
                {/* Bandeira sempre fora, nunca sobrepõe */}
                <span className="text-base shrink-0">🏁</span>
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
