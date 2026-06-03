import { RankingTable } from "@/components/RankingTable"
import { Card, CardContent } from "@/components/ui/card"
import { createSupabaseServerClient } from "@/lib/supabase"
import { Score } from "@/types"

export default async function RankingPage() {
  const supabase = createSupabaseServerClient()

  const { data: ranking } = await supabase
    .from("scores")
    .select("user_id,total_pontos,acertos_exatos,acertos_resultado,total_palpites,profiles(nome,avatar_url)")
    .order("total_pontos", { ascending: false })
    .order("acertos_exatos", { ascending: false })
    .order("acertos_resultado", { ascending: false })

  if (!ranking?.length) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          Ranking ainda sem pontuações. Aguarde o lançamento dos resultados dos jogos.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold text-primary">Ranking completo</h1>
      <RankingTable ranking={ranking as unknown as Score[]} title="Classificação geral" />
    </div>
  )
}
