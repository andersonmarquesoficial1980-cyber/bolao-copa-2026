"use client"

import { submitPredictionAction } from "@/app/actions"
import { formatDate } from "@/lib/utils"
import { Game, Prediction } from "@/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { PlacarBandeiras } from "@/components/PlacarBandeiras"
import { TituloJogo } from "@/components/TituloJogo"
import { useRef, useState, useTransition } from "react"

interface OtherPrediction {
  palpite_casa: number
  palpite_fora: number
  profiles: { nome: string; avatar_url?: string } | null
}

interface GameCardProps {
  game: Game
  prediction?: Prediction
  otherPredictions?: OtherPrediction[]
  bloqueadoPorPagamento?: boolean
}

function statusLabel(status: string, hasStarted: boolean) {
  if (status === "finished") return { label: "Encerrado", color: "bg-zinc-500" }
  if (hasStarted) return { label: "Em andamento", color: "bg-green-500" }
  return { label: "Agendado", color: "bg-blue-500" }
}

export function GameCard({ game, prediction, otherPredictions = [], bloqueadoPorPagamento = false }: GameCardProps) {
  const cutoff = new Date(new Date(game.data_jogo).getTime() - 10 * 60 * 1000)
  const hasStarted = new Date() >= cutoff
  const { label, color } = statusLabel(game.status, hasStarted)
  const canPredict = !hasStarted && game.status === "scheduled"

  const [toast, setToast] = useState<{ msg: string; tipo: "success" | "error" } | null>(null)
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  function showToast(msg: string, tipo: "success" | "error") {
    setToast({ msg, tipo })
    setTimeout(() => setToast(null), 3500)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = formRef.current
    if (!form) return
    const fd = new FormData(form)

    startTransition(async () => {
      const result = await submitPredictionAction(fd)
      if (result.ok) {
        showToast("✅ " + result.message, "success")
      } else {
        showToast("❌ " + result.message, "error")
      }
    })
  }

  return (
    <Card className="flex flex-col relative">
      {/* Toast */}
      {toast && (
        <div className={`absolute top-2 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl shadow-lg text-sm font-medium text-white transition-all
          ${toast.tipo === "success" ? "bg-green-600" : "bg-red-600"}`}>
          {toast.msg}
        </div>
      )}

      <CardHeader className="space-y-2 pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base leading-tight">
            <TituloJogo
              bandeiraCasa={game.bandeira_casa ?? ""}
              bandeiraFora={game.bandeira_fora ?? ""}
              timeCasa={game.time_casa}
              timoFora={game.time_fora}
              flagSize="20"
            />
          </CardTitle>
          <Badge className={`${color} text-white shrink-0 text-xs`}>{label}</Badge>
        </div>
        <p className="text-xs text-muted-foreground">{formatDate(game.data_jogo)}</p>

        {game.status === "finished" && game.placar_casa !== null && (
          <PlacarBandeiras
            bandeiraCasa={game.bandeira_casa ?? ""}
            bandeiraFora={game.bandeira_fora ?? ""}
            placarCasa={game.placar_casa}
            placarFora={game.placar_fora}
          />
        )}
      </CardHeader>

      <CardContent className="space-y-4 pt-0 flex-1 flex flex-col justify-between">
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-3">
          <input type="hidden" name="game_id" value={game.id} />
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor={`palpite-casa-${game.id}`} className="text-xs">{game.time_casa}</Label>
              <Input
                id={`palpite-casa-${game.id}`}
                name="palpite_casa"
                type="number"
                min={0}
                defaultValue={prediction?.palpite_casa ?? ""}
                required
                disabled={!canPredict}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor={`palpite-fora-${game.id}`} className="text-xs">{game.time_fora}</Label>
              <Input
                id={`palpite-fora-${game.id}`}
                name="palpite_fora"
                type="number"
                min={0}
                defaultValue={prediction?.palpite_fora ?? ""}
                required
                disabled={!canPredict}
              />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={!canPredict || bloqueadoPorPagamento || isPending}>
            {isPending
              ? "Salvando..."
              : bloqueadoPorPagamento
              ? "🔒 Pague R$ 20 para palpitar"
              : canPredict
              ? "Salvar palpite"
              : hasStarted
              ? "Palpites encerrados"
              : "Encerrado"}
          </Button>
        </form>

        {otherPredictions.length > 0 && (
          <div className="space-y-2 border-t pt-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Palpites da galera</p>
            <div className="flex flex-wrap gap-2">
              {otherPredictions.map((p, i) => (
                <div key={i} className="flex items-center gap-1.5 rounded-full bg-muted px-2 py-1 text-xs">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={p.profiles?.avatar_url} />
                    <AvatarFallback className="text-[9px]">
                      {(p.profiles?.nome || "?").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{p.profiles?.nome?.split(" ")[0]}</span>
                  <span className="text-muted-foreground">
                    {game.bandeira_casa} {p.palpite_casa} × {p.palpite_fora} {game.bandeira_fora}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
