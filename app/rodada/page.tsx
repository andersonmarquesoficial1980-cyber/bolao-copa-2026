import { Card, CardContent } from "@/components/ui/card"
import { createSupabaseServerClient } from "@/lib/supabase"
import { Game, Prediction } from "@/types"
import { RodadaPorData } from "@/components/RodadaPorData"

interface RodadaPageProps {
  searchParams?: { error?: string; success?: string }
}

export default async function RodadaPage({ searchParams }: RodadaPageProps) {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [{ data: games }, { data: predictions }, { data: allPredictions }, { data: pagamento }] = await Promise.all([
    supabase
      .from("games")
      .select("id,group_id,time_casa,time_fora,bandeira_casa,bandeira_fora,data_jogo,placar_casa,placar_fora,status")
      .neq("status", "cancelled")
      .order("data_jogo", { ascending: true }),
    supabase.from("predictions").select("*").eq("user_id", user.id),
    supabase.from("predictions").select("game_id,palpite_casa,palpite_fora,profiles(nome,avatar_url)"),
    supabase.from("registrations").select("id").eq("user_id", user.id).eq("status", "paid").maybeSingle()
  ])

  const jaPagou = !!pagamento
  const corte13 = new Date("2026-06-13T00:00:00-03:00")

  const predictionMap = new Map((predictions || []).map(p => [p.game_id, p as Prediction]))

  const allPredictionsMap = new Map<string, { palpite_casa: number; palpite_fora: number; profiles: { nome: string; avatar_url?: string } | null }[]>()
  for (const p of allPredictions || []) {
    const arr = allPredictionsMap.get(p.game_id) || []
    arr.push({ palpite_casa: p.palpite_casa, palpite_fora: p.palpite_fora, profiles: p.profiles as unknown as { nome: string; avatar_url?: string } | null })
    allPredictionsMap.set(p.game_id, arr)
  }

  return (
    <div className="space-y-4">
      <section>
        <h1 className="text-3xl font-bold text-primary">Palpites</h1>
        <p className="text-muted-foreground text-sm">Escolha o dia e faça seus palpites antes de cada jogo começar.</p>
      </section>

      {searchParams?.error && (
        <p className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">{searchParams.error}</p>
      )}
      {searchParams?.success && (
        <p className="rounded-md border border-green-300 bg-green-50 p-3 text-sm text-green-700">{searchParams.success}</p>
      )}

      {!jaPagou && (
        <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-800">
          ⚠️ Jogos de 11/06 e 12/06 são gratuitos. A partir de 13/06, é necessário pagar a inscrição de R$ 20,00 para palpitar.
          <a href="/dashboard" className="ml-1 font-semibold underline">Pagar agora</a>
        </div>
      )}

      {games?.length ? (
        <RodadaPorData
          games={games as Game[]}
          predictionMap={predictionMap}
          allPredictionsMap={allPredictionsMap}
          jaPagou={jaPagou}
          corte13={corte13}
        />
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">Não existem jogos cadastrados ainda.</CardContent>
        </Card>
      )}
    </div>
  )
}
