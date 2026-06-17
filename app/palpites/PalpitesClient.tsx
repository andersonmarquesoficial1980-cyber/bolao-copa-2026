"use client"

import { useState } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { TituloJogo } from "@/components/TituloJogo"
import { Card, CardContent } from "@/components/ui/card"

type Palpite = {
  nome: string
  avatar_url?: string
  palpite_casa: number
  palpite_fora: number
  acerto: "exato" | "resultado" | null
}

type Jogo = {
  id: string
  time_casa: string
  time_fora: string
  bandeira_casa: string
  bandeira_fora: string
  data_jogo: string
  placar_casa: number | null
  placar_fora: number | null
  status: string
  palpites: Palpite[]
  dataLabel: string   // "15/06/2026"
  horaLabel: string   // "13:00"
}

export function PalpitesClient({ jogos }: { jogos: Jogo[] }) {
  // Agrupa datas únicas
  const datas = Array.from(new Set(jogos.map(j => j.dataLabel)))

  const [dataSel, setDataSel] = useState<string | null>(null)
  const [jogoSel, setJogoSel] = useState<string | null>(null)

  const jogosDaData = dataSel ? jogos.filter(j => j.dataLabel === dataSel) : []
  const jogoAtual = jogoSel ? jogos.find(j => j.id === jogoSel) : null

  function selecionarData(data: string) {
    setDataSel(data)
    setJogoSel(null)
  }

  function voltar() {
    if (jogoSel) { setJogoSel(null); return }
    setDataSel(null)
  }

  // Tela 1 — escolha de data
  if (!dataSel) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">Selecione uma data para ver os jogos.</p>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {datas.map(data => {
            const jogosNaData = jogos.filter(j => j.dataLabel === data)
            return (
              <button
                key={data}
                onClick={() => selecionarData(data)}
                className="rounded-xl border p-4 text-left hover:border-primary hover:bg-primary/5 transition-colors space-y-1"
              >
                <p className="font-bold text-base">📅 {data}</p>
                <p className="text-sm text-muted-foreground">
                  {jogosNaData.length} jogo{jogosNaData.length !== 1 ? "s" : ""}
                  {" · "}
                  {jogosNaData.reduce((s, j) => s + j.palpites.length, 0)} palpites
                </p>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // Tela 2 — escolha de jogo
  if (!jogoSel) {
    return (
      <div className="space-y-4">
        <button onClick={voltar} className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1">
          ← Voltar
        </button>
        <p className="font-semibold">Jogos de {dataSel}</p>
        <div className="grid gap-3">
          {jogosDaData.map(j => (
            <button
              key={j.id}
              onClick={() => setJogoSel(j.id)}
              className="rounded-xl border p-4 text-left hover:border-primary hover:bg-primary/5 transition-colors"
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <TituloJogo
                  bandeiraCasa={j.bandeira_casa}
                  bandeiraFora={j.bandeira_fora}
                  timeCasa={j.time_casa}
                  timoFora={j.time_fora}
                  className="font-bold text-base"
                  flagSize="20"
                />
                <div className="flex items-center gap-2">
                  {j.status === "finished" && j.placar_casa !== null && (
                    <span className="text-sm font-bold text-primary">{j.placar_casa}–{j.placar_fora}</span>
                  )}
                  <span className="text-xs text-muted-foreground">{j.horaLabel}</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {j.palpites.length} palpite{j.palpites.length !== 1 ? "s" : ""}
              </p>
            </button>
          ))}
        </div>
      </div>
    )
  }

  // Tela 3 — palpites do jogo
  const j = jogoAtual!
  return (
    <div className="space-y-4">
      <button onClick={voltar} className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1">
        ← Voltar
      </button>

      <div className="rounded-xl border p-4 space-y-1">
        <TituloJogo
          bandeiraCasa={j.bandeira_casa}
          bandeiraFora={j.bandeira_fora}
          timeCasa={j.time_casa}
          timoFora={j.time_fora}
          className="font-bold text-lg"
          flagSize="32"
        />
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>{j.dataLabel} · {j.horaLabel}</span>
          {j.status === "finished" && j.placar_casa !== null && (
            <span className="font-bold text-primary">Resultado: {j.placar_casa}–{j.placar_fora}</span>
          )}
        </div>
      </div>

      {j.palpites.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground text-sm">
            Nenhum palpite para este jogo ainda.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-4 divide-y p-0">
            {j.palpites.map((p, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                      {p.nome.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
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
