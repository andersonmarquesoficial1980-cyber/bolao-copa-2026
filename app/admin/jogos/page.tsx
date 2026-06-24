import { createGameAction, updateGameStatusAction } from "@/app/admin/actions"
import { BloqueioJogoToggle } from "@/components/BloqueioJogoToggle"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createSupabaseServerClient } from "@/lib/supabase"
import { formatDate } from "@/lib/utils"
import { Game } from "@/types"

interface AdminJogosPageProps {
  searchParams?: { error?: string; success?: string }
}

export default async function AdminJogosPage({ searchParams }: AdminJogosPageProps) {
  const supabase = createSupabaseServerClient()
  const { data: games } = await supabase
    .from("games")
    .select("id,time_casa,time_fora,data_jogo,status,group_id,palpites_bloqueados")
    .order("data_jogo", { ascending: true })

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-3xl font-bold text-primary">Gerenciar jogos</h1>
      </section>

      {searchParams?.error && (
        <p className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">{searchParams.error}</p>
      )}
      {searchParams?.success && (
        <p className="rounded-md border border-green-300 bg-green-50 p-3 text-sm text-green-700">{searchParams.success}</p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Novo jogo</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createGameAction} className="grid gap-3 md:grid-cols-3">
            <div>
              <Label htmlFor="time_casa">Time da casa</Label>
              <Input id="time_casa" name="time_casa" required />
            </div>
            <div>
              <Label htmlFor="time_fora">Time visitante</Label>
              <Input id="time_fora" name="time_fora" required />
            </div>
            <div>
              <Label htmlFor="group_id">Fase/Grupo</Label>
              <Input id="group_id" name="group_id" placeholder="grupo-a ou quartas" />
            </div>
            <div>
              <Label htmlFor="bandeira_casa">URL bandeira casa</Label>
              <Input id="bandeira_casa" name="bandeira_casa" />
            </div>
            <div>
              <Label htmlFor="bandeira_fora">URL bandeira fora</Label>
              <Input id="bandeira_fora" name="bandeira_fora" />
            </div>
            <div>
              <Label htmlFor="data_jogo">Data e horário</Label>
              <Input id="data_jogo" name="data_jogo" type="datetime-local" required />
            </div>
            <div className="md:col-span-3">
              <Button type="submit">Cadastrar jogo</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Jogos cadastrados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(games as Game[] | null)?.map((game) => (
            <form
              key={game.id}
              action={updateGameStatusAction}
              className="flex flex-col gap-3 rounded-lg border border-border p-3 md:flex-row md:items-center md:justify-between"
            >
              <input type="hidden" name="game_id" value={game.id} />
              <div>
                <p className="font-semibold">
                  {game.time_casa} x {game.time_fora}
                </p>
                <p className="text-sm text-muted-foreground">{formatDate(game.data_jogo)}</p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  name="status"
                  defaultValue={game.status}
                  className="h-10 rounded-md border border-border bg-background px-3 text-sm"
                >
                  <option value="scheduled">Agendado</option>
                  <option value="live">Ao vivo</option>
                  <option value="finished">Finalizado</option>
                  <option value="cancelled">Cancelado</option>
                </select>
                <Button type="submit" variant="outline">
                  Atualizar
                </Button>
                <BloqueioJogoToggle
                  gameId={game.id}
                  bloqueado={(game as Game & { palpites_bloqueados: boolean }).palpites_bloqueados ?? false}
                  bloqueadoAutomatico={new Date() >= new Date(game.data_jogo)}
                />
              </div>
            </form>
          ))}

          {!games?.length && <p className="text-sm text-muted-foreground">Nenhum jogo cadastrado.</p>}
        </CardContent>
      </Card>
    </div>
  )
}
