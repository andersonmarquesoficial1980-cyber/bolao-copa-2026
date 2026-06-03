import { GameCard } from "@/components/GameCard"
import { Card, CardContent } from "@/components/ui/card"
import { createSupabaseServerClient } from "@/lib/supabase"
import { Game, Prediction } from "@/types"

interface RodadaPageProps {
  searchParams?: { error?: string; success?: string }
}

export default async function RodadaPage({ searchParams }: RodadaPageProps) {
  const supabase = createSupabaseServerClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) return null

  const [{ data: games }, { data: predictions }] = await Promise.all([
    supabase
      .from("games")
      .select("id,group_id,time_casa,time_fora,bandeira_casa,bandeira_fora,data_jogo,placar_casa,placar_fora,status")
      .neq("status", "cancelled")
      .order("data_jogo", { ascending: true }),
    supabase.from("predictions").select("*").eq("user_id", user.id)
  ])

  const predictionMap = new Map((predictions || []).map((prediction) => [prediction.game_id, prediction as Prediction]))

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-3xl font-bold text-primary">Palpites da rodada</h1>
        <p className="text-muted-foreground">Envie ou edite seus palpites até o início de cada partida.</p>
      </section>

      {searchParams?.error && (
        <p className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">{searchParams.error}</p>
      )}
      {searchParams?.success && (
        <p className="rounded-md border border-green-300 bg-green-50 p-3 text-sm text-green-700">{searchParams.success}</p>
      )}

      <section className="grid gap-4 md:grid-cols-2">
        {(games as Game[] | null)?.map((game) => (
          <GameCard key={game.id} game={game} prediction={predictionMap.get(game.id)} />
        ))}
      </section>

      {!games?.length && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">Não existem jogos cadastrados ainda.</CardContent>
        </Card>
      )}
    </div>
  )
}
