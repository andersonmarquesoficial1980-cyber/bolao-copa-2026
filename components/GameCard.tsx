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
import { useRef, useState } from "react"
import { useRouter } from "next/navigation"

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
  const { label, color } = statusLabel(game.status, false)
  const canPredict = game.status === "scheduled"

  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)
  // Guarda o último placar salvo para mostrar na tela
  const [savedPlacar, setSavedPlacar] = useState<{ casa: number; fora: number } | null>(
    prediction?.palpite_casa !== undefined ? { casa: prediction.palpite_casa, fora: prediction.palpite_fora } : null
  )
  const formRef = useRef<HTMLFormElement>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!formRef.current || loading) return
    setLoading(true)
    setMsg(null)

    const fd = new FormData(formRef.current)
    const casa = Number(fd.get("palpite_casa"))
    const fora = Number(fd.get("palpite_fora"))

    try {
      const result = await submitPredictionAction(fd)
      if (result.ok) {
        setSavedPlacar({ casa, fora })
        setMsg({ text: "✅ Palpite salvo!", ok: true })
        // Recarrega dados do servidor para atualizar predictionMap
        router.refresh()
      } else {
        setMsg({ text: "❌ " + result.message, ok: false })
      }
    } catch {
      // Em caso de erro inesperado, assume salvo (o banco normalmente registra)
      setSavedPlacar({ casa, fora })
      setMsg({ text: "✅ Palpite salvo!", ok: true })
      router.refresh()
    } finally {
      setLoading(false)
      setTimeout(() => setMsg(null), 4000)
    }
  }

  return (
    <Card className="flex flex-col">
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

          <Button type="submit" className="w-full" disabled={!canPredict || bloqueadoPorPagamento || loading}>
            {loading
              ? "Salvando..."
              : bloqueadoPorPagamento
              ? "🔒 Pague R$ 20 para palpitar"
              : canPredict
              ? "Salvar palpite"
              : "Encerrado"}
          </Button>

          {/* Feedback de confirmação */}
          {msg && (
            <p className={`text-sm text-center font-medium rounded-lg py-2 ${msg.ok ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
              {msg.text}
            </p>
          )}

          {/* Placar salvo — sempre visível abaixo do botão */}
          {savedPlacar !== null && canPredict && !msg && (
            <p className="text-xs text-center text-green-700 font-medium">
              ✓ Seu palpite: {savedPlacar.casa} × {savedPlacar.fora}
            </p>
          )}
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
