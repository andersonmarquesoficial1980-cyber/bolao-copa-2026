import { submitPredictionAction } from "@/app/actions"
import { formatDate } from "@/lib/utils"
import { Game, Prediction } from "@/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface OtherPrediction {
  palpite_casa: number
  palpite_fora: number
  profiles: { nome: string; avatar_url?: string } | null
}

interface GameCardProps {
  game: Game
  prediction?: Prediction
  otherPredictions?: OtherPrediction[]
}

function statusLabel(status: string, hasStarted: boolean) {
  if (status === "finished") return { label: "Encerrado", color: "bg-zinc-500" }
  if (hasStarted) return { label: "Em andamento", color: "bg-green-500" }
  return { label: "Agendado", color: "bg-blue-500" }
}

export function GameCard({ game, prediction, otherPredictions = [] }: GameCardProps) {
  const hasStarted = new Date(game.data_jogo) <= new Date()
  const { label, color } = statusLabel(game.status, hasStarted)
  const canPredict = !hasStarted && game.status === "scheduled"

  return (
    <Card className="flex flex-col">
      <CardHeader className="space-y-2 pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base leading-tight">
            {game.bandeira_casa} {game.time_casa} × {game.time_fora} {game.bandeira_fora}
          </CardTitle>
          <Badge className={`${color} text-white shrink-0 text-xs`}>{label}</Badge>
        </div>
        <p className="text-xs text-muted-foreground">{formatDate(game.data_jogo)}</p>

        {/* Placar real se finalizado */}
        {game.status === "finished" && game.placar_casa !== null && (
          <p className="text-center text-2xl font-bold text-primary">
            {game.placar_casa} – {game.placar_fora}
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-4 pt-0 flex-1 flex flex-col justify-between">
        {/* Palpite do usuário */}
        <form action={submitPredictionAction} className="space-y-3">
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
          <Button type="submit" className="w-full" disabled={!canPredict}>
            {canPredict ? "Salvar palpite" : hasStarted ? "Palpites encerrados" : "Encerrado"}
          </Button>
        </form>

        {/* Palpites dos outros (visível após início ou se já palpitou) */}
        {(hasStarted || game.status === "finished") && otherPredictions.length > 0 && (
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
                  <span className="text-muted-foreground">{p.palpite_casa}×{p.palpite_fora}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
