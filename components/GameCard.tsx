import { submitPredictionAction } from "@/app/actions"
import { formatDate } from "@/lib/utils"
import { Game, Prediction } from "@/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface GameCardProps {
  game: Game
  prediction?: Prediction
}

export function GameCard({ game, prediction }: GameCardProps) {
  const hasStarted = new Date(game.data_jogo) <= new Date()

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-lg">
            {game.time_casa} x {game.time_fora}
          </CardTitle>
          <Badge>{game.status}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">{formatDate(game.data_jogo)}</p>
      </CardHeader>

      <CardContent>
        <form action={submitPredictionAction} className="space-y-3">
          <input type="hidden" name="game_id" value={game.id} />
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor={`palpite-casa-${game.id}`}>{game.time_casa}</Label>
              <Input
                id={`palpite-casa-${game.id}`}
                name="palpite_casa"
                type="number"
                min={0}
                defaultValue={prediction?.palpite_casa ?? ""}
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor={`palpite-fora-${game.id}`}>{game.time_fora}</Label>
              <Input
                id={`palpite-fora-${game.id}`}
                name="palpite_fora"
                type="number"
                min={0}
                defaultValue={prediction?.palpite_fora ?? ""}
                required
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={hasStarted || game.status !== "scheduled"}>
            {hasStarted ? "Palpites encerrados" : "Salvar palpite"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
