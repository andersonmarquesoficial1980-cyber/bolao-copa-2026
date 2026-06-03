import { saveResultAction } from "@/app/admin/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { createSupabaseServerClient } from "@/lib/supabase"
import { formatDate } from "@/lib/utils"
import { Game } from "@/types"

interface AdminResultadosPageProps {
  searchParams?: { error?: string; success?: string }
}

export default async function AdminResultadosPage({ searchParams }: AdminResultadosPageProps) {
  const supabase = createSupabaseServerClient()

  const { data: games } = await supabase
    .from("games")
    .select("id,time_casa,time_fora,data_jogo,status,placar_casa,placar_fora")
    .order("data_jogo", { ascending: true })

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-3xl font-bold text-primary">Lançar resultados</h1>
      </section>

      {searchParams?.error && (
        <p className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">{searchParams.error}</p>
      )}
      {searchParams?.success && (
        <p className="rounded-md border border-green-300 bg-green-50 p-3 text-sm text-green-700">{searchParams.success}</p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Partidas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(games as Game[] | null)?.map((game) => (
            <form
              key={game.id}
              action={saveResultAction}
              className="grid gap-2 rounded-lg border border-border p-3 md:grid-cols-[1fr_auto_auto_auto] md:items-center"
            >
              <input type="hidden" name="game_id" value={game.id} />

              <div>
                <p className="font-semibold">
                  {game.time_casa} x {game.time_fora}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(game.data_jogo)} • status atual: {game.status}
                </p>
              </div>

              <Input
                name="placar_casa"
                type="number"
                min={0}
                required
                defaultValue={game.placar_casa ?? ""}
                placeholder="Casa"
                className="w-24"
              />
              <Input
                name="placar_fora"
                type="number"
                min={0}
                required
                defaultValue={game.placar_fora ?? ""}
                placeholder="Fora"
                className="w-24"
              />

              <Button type="submit">Salvar</Button>
            </form>
          ))}

          {!games?.length && <p className="text-sm text-muted-foreground">Nenhum jogo disponível.</p>}
        </CardContent>
      </Card>
    </div>
  )
}
