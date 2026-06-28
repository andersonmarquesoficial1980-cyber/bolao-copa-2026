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

const FASE_CONFIG: Record<Fase, { label: string; emoji: string; gradient: string }> = {
  grupo:          { label: "Fase de Grupos",   emoji: "⚽", gradient: "from-[#1B3A8C] to-[#2d5fd4]" },
  oitavas:        { label: "Segunda Fase",      emoji: "🔥", gradient: "from-[#0f6e3a] to-[#1aad5c]" },
  quartas:        { label: "Quartas de Final",  emoji: "⚡", gradient: "from-[#7c2d12] to-[#ea580c]" },
  semifinal:      { label: "Semifinal",         emoji: "🏆", gradient: "from-[#4c1d95] to-[#7c3aed]" },
  terceiro_lugar: { label: "3º Lugar",          emoji: "🥉", gradient: "from-[#374151] to-[#6b7280]" },
  final:          { label: "Final",             emoji: "👑", gradient: "from-[#92400e] to-[#f59e0b]" },
}

const FASE_ORDER: Fase[] = ["grupo", "oitavas", "quartas", "semifinal", "terceiro_lugar", "final"]

export function PalpitesClient({ jogos }: { jogos: Jogo[] }) {
  const [faseAberta, setFaseAberta] = useState<Fase | null>(null)
  const [dataSel, setDataSel] = useState<string | null>(null)
  const [jogoSel, setJogoSel] = useState<string | null>(null)

  const fasesComJogos = FASE_ORDER.filter(f => jogos.some(j => j.fase === f))

  function abrirFase(fase: Fase) {
    if (faseAberta === fase) { setFaseAberta(null); setDataSel(null); setJogoSel(null); return }
    setFaseAberta(fase)
    setDataSel(null)
    setJogoSel(null)
  }

  function voltar() {
    if (jogoSel) { setJogoSel(null); return }
    if (dataSel) { setDataSel(null); return }
    setFaseAberta(null)
  }

  // Tela 3 — palpites do jogo
  if (jogoSel) {
    const j = jogos.find(j => j.id === jogoSel)!
    const cfg = FASE_CONFIG[j.fase]
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
  if (dataSel && faseAberta) {
    const jogosDaData = jogos.filter(j => j.fase === faseAberta && j.dataLabel === dataSel)
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

  // Tela 1 — cards de fase
  return (
    <div className="space-y-4">
      {fasesComJogos.map(fase => {
        const cfg = FASE_CONFIG[fase]
        const jogosDaFase = jogos.filter(j => j.fase === fase)
        const isOpen = faseAberta === fase
        const totalPalpites = jogosDaFase.reduce((s, j) => s + j.palpites.length, 0)
        const totalJogos = jogosDaFase.length

        // Datas únicas da fase
        const datas = Array.from(new Set(jogosDaFase.map(j => j.dataLabel)))

        return (
          <div key={fase} className="rounded-2xl overflow-hidden shadow-lg">
            {/* Card da fase */}
            <button
              onClick={() => abrirFase(fase)}
              className={`w-full bg-gradient-to-r ${cfg.gradient} text-white px-5 py-4 flex items-center justify-between hover:brightness-110 transition-all`}
            >
              <div className="flex items-center gap-4">
                <span className="text-3xl">{cfg.emoji}</span>
                <div className="text-left">
                  <div className="font-bold text-lg">{cfg.label}</div>
                  <div className="text-sm opacity-80">{totalJogos} jogos · {totalPalpites} palpites</div>
                </div>
              </div>
              <span className="text-2xl transition-transform duration-200" style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}>▼</span>
            </button>

            {/* Datas da fase */}
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
