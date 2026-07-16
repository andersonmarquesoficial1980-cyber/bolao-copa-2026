"use client"

import { useState } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { TituloJogo } from "@/components/TituloJogo"
import { Card, CardContent } from "@/components/ui/card"
import { Fase } from "@/types"

type Palpite = {
  nome: string
  avatar_url?: string
  palpite_casa: number
  palpite_fora: number
  acerto: "exato" | "resultado" | null
}

type Jogo = {
  id: string
  fase: Fase
  groupNome?: string
  time_casa: string
  time_fora: string
  bandeira_casa: string
  bandeira_fora: string
  data_jogo: string
  placar_casa: number | null
  placar_fora: number | null
  status: string
  palpites: Palpite[]
  dataLabel: string
  horaLabel: string
}

// Chave de agrupamento: usa groupNome quando fase é terceiro_lugar (dois grupos com mesma fase)
function grupoKey(j: Jogo): string {
  if (j.fase === "terceiro_lugar" && j.groupNome) return `terceiro_lugar:${j.groupNome}`
  return j.fase
}

type GrupoConfig = { label: string; emoji: string; gradient: string }

const FASE_CONFIG: Record<Fase, GrupoConfig> = {
  grupo:          { label: "Fase de Grupos",   emoji: "⚽", gradient: "from-[#1B3A8C] to-[#2d5fd4]" },
  oitavas:        { label: "Segunda Fase",      emoji: "🔥", gradient: "from-[#0f6e3a] to-[#1aad5c]" },
  quartas:        { label: "Oitavas de Final",  emoji: "⚡", gradient: "from-[#7c2d12] to-[#ea580c]" },
  semifinal:      { label: "Quartas de Final",  emoji: "🔥", gradient: "from-[#4c1d95] to-[#7c3aed]" },
  terceiro_lugar: { label: "3º Lugar",          emoji: "🥉", gradient: "from-[#374151] to-[#6b7280]" },
  final:          { label: "Semifinal",         emoji: "🏆", gradient: "from-[#92400e] to-[#f59e0b]" },
}

// Override por nome do grupo (quando fase é reutilizada)
const GRUPO_NOME_OVERRIDE: Record<string, GrupoConfig> = {
  "Final":    { label: "Final",   emoji: "👑", gradient: "from-[#b45309] to-[#f59e0b]" },
  "3º Lugar": { label: "3º Lugar", emoji: "🥉", gradient: "from-[#374151] to-[#6b7280]" },
}

function getCfg(j: Jogo): GrupoConfig {
  if (j.fase === "terceiro_lugar" && j.groupNome && GRUPO_NOME_OVERRIDE[j.groupNome]) {
    return GRUPO_NOME_OVERRIDE[j.groupNome]
  }
  return FASE_CONFIG[j.fase]
}

// Ordem de exibição das fases/grupos
const GRUPO_ORDER = [
  "grupo", "oitavas", "quartas", "semifinal", "final",
  "terceiro_lugar:3º Lugar", "terceiro_lugar:Final",
]

export function PalpitesClient({ jogos }: { jogos: Jogo[] }) {
  const [grupoAberto, setGrupoAberto] = useState<string | null>(null)
  const [dataSel, setDataSel]         = useState<string | null>(null)
  const [jogoSel, setJogoSel]         = useState<string | null>(null)

  // Grupos únicos presentes nos jogos, na ordem certa
  const gruposComJogos = GRUPO_ORDER.filter(k => jogos.some(j => grupoKey(j) === k))

  function abrirGrupo(k: string) {
    if (grupoAberto === k) { setGrupoAberto(null); setDataSel(null); setJogoSel(null); return }
    setGrupoAberto(k); setDataSel(null); setJogoSel(null)
  }

  function voltar() {
    if (jogoSel) { setJogoSel(null); return }
    if (dataSel) { setDataSel(null); return }
    setGrupoAberto(null)
  }

  // Tela 3 — palpites do jogo
  if (jogoSel) {
    const j = jogos.find(j => j.id === jogoSel)!
    return (
      <div className="space-y-4">
        <button onClick={voltar} className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1">← Voltar</button>
        <div className="rounded-xl border p-4 space-y-1">
          <TituloJogo bandeiraCasa={j.bandeira_casa} bandeiraFora={j.bandeira_fora} timeCasa={j.time_casa} timoFora={j.time_fora} className="font-bold text-lg" />
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>{j.dataLabel} · {j.horaLabel}</span>
            {j.status === "finished" && j.placar_casa !== null && (
              <span className="font-bold text-primary">Resultado: {j.placar_casa}–{j.placar_fora}</span>
            )}
          </div>
        </div>
        {j.palpites.length === 0 ? (
          <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">Nenhum palpite para este jogo.</CardContent></Card>
        ) : (
          <Card>
            <CardContent className="pt-4 divide-y p-0">
              {j.palpites.map((p, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs bg-blue-100 text-blue-700">{p.nome.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-sm">{p.nome}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">{p.palpite_casa} × {p.palpite_fora}</span>
                    {p.acerto === "exato" && <Badge className="bg-green-500 text-white text-xs">✅ Exato</Badge>}
                    {p.acerto === "resultado" && <Badge className="bg-blue-500 text-white text-xs">👍 Resultado</Badge>}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  // Tela 2 — jogos da data
  if (dataSel && grupoAberto) {
    const jogosDaData = jogos.filter(j => grupoKey(j) === grupoAberto && j.dataLabel === dataSel)
    return (
      <div className="space-y-4">
        <button onClick={voltar} className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1">← Voltar</button>
        <p className="font-semibold">Jogos de {dataSel}</p>
        <div className="grid gap-3">
          {jogosDaData.map(j => (
            <button key={j.id} onClick={() => setJogoSel(j.id)}
              className="rounded-xl border p-4 text-left hover:border-primary hover:bg-primary/5 transition-colors">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <TituloJogo bandeiraCasa={j.bandeira_casa} bandeiraFora={j.bandeira_fora} timeCasa={j.time_casa} timoFora={j.time_fora} className="font-bold text-base" />
                <div className="flex items-center gap-2">
                  {j.status === "finished" && j.placar_casa !== null && (
                    <span className="text-sm font-bold text-primary">{j.placar_casa}–{j.placar_fora}</span>
                  )}
                  <span className="text-xs text-muted-foreground">{j.horaLabel}</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{j.palpites.length} palpite{j.palpites.length !== 1 ? "s" : ""}</p>
            </button>
          ))}
        </div>
      </div>
    )
  }

  // Tela 1 — cards de fase/grupo
  return (
    <div className="space-y-4">
      {gruposComJogos.map(grupoK => {
        const jogosDaFase = jogos.filter(j => grupoKey(j) === grupoK)
        const cfg = getCfg(jogosDaFase[0])
        const isOpen = grupoAberto === grupoK
        const totalPalpites = jogosDaFase.reduce((s, j) => s + j.palpites.length, 0)
        const totalJogos = jogosDaFase.length
        const datas = Array.from(new Set(jogosDaFase.map(j => j.dataLabel)))

        return (
          <div key={grupoK} className="rounded-2xl overflow-hidden shadow-lg">
            <button
              onClick={() => abrirGrupo(grupoK)}
              className={`w-full bg-gradient-to-r ${cfg.gradient} text-white px-5 py-4 flex items-center justify-between hover:brightness-110 transition-all`}
            >
              <div className="flex items-center gap-4">
                <span className="text-3xl">{cfg.emoji}</span>
                <div className="text-left">
                  <div className="font-bold text-lg">{cfg.label}</div>
                  <div className="text-sm opacity-80">{totalJogos} jogo{totalJogos !== 1 ? "s" : ""} · {totalPalpites} palpites</div>
                </div>
              </div>
              <span className="text-2xl transition-transform duration-200" style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}>▼</span>
            </button>

            {isOpen && (
              <div className="bg-zinc-50 border-x border-b border-zinc-200 rounded-b-2xl">
                <div className="grid gap-3 p-4 sm:grid-cols-2 md:grid-cols-3">
                  {datas.map(data => {
                    const jogosNaData = jogosDaFase.filter(j => j.dataLabel === data)
                    const palpitesNaData = jogosNaData.reduce((s, j) => s + j.palpites.length, 0)
                    return (
                      <button
                        key={data}
                        onClick={() => setDataSel(data)}
                        className="rounded-xl border bg-white p-4 text-left hover:border-primary hover:bg-primary/5 transition-colors space-y-1 shadow-sm"
                      >
                        <p className="font-bold text-base">📅 {data}</p>
                        <p className="text-sm text-muted-foreground">
                          {jogosNaData.length} jogo{jogosNaData.length !== 1 ? "s" : ""} · {palpitesNaData} palpites
                        </p>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
