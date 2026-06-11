import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createSupabaseServerClient } from "@/lib/supabase"
import { RankingRace } from "@/components/RankingRace"
import { RankingTable } from "@/components/RankingTable"
import { Score } from "@/types"

export default async function DashboardPage() {
  const supabase = createSupabaseServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [{ data: profile }, { data: score }, predResult, { data: ranking }] = await Promise.all([
    supabase.from("profiles").select("nome").eq("id", user.id).single(),
    supabase.from("scores").select("total_pontos,acertos_exatos,acertos_resultado,total_palpites").eq("user_id", user.id).maybeSingle(),
    supabase.from("predictions").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    // Busca todos que palpitaram, com scores se existirem
    supabase.from("profiles")
      .select("id,nome,avatar_url,scores(total_pontos,acertos_exatos,acertos_resultado,total_palpites)")
      .order("nome", { ascending: true })
  ])

  const totalPredictions = predResult.count ?? 0

  // Normaliza ranking para o formato Score esperado pelos componentes
  const normalizedRanking: Score[] = ((ranking || []) as unknown as Array<{
    id: string; nome: string; avatar_url?: string;
    scores: { total_pontos: number; acertos_exatos: number; acertos_resultado: number; total_palpites: number } | null
  }>)
    .map(p => ({
      user_id: p.id,
      total_pontos: p.scores?.total_pontos ?? 0,
      acertos_exatos: p.scores?.acertos_exatos ?? 0,
      acertos_resultado: p.scores?.acertos_resultado ?? 0,
      total_palpites: p.scores?.total_palpites ?? 0,
      profiles: { nome: p.nome, avatar_url: p.avatar_url },
    }))
    .sort((a, b) => b.total_pontos - a.total_pontos || b.acertos_exatos - a.acertos_exatos)

  return (
    <div className="space-y-6">
      {/* Saudação */}
      <section className="space-y-1">
        <h1 className="text-3xl font-bold text-primary">Olá, {profile?.nome || "participante"} ⚽</h1>
      </section>

      {/* Stats do usuário */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs text-muted-foreground">Pontos</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold text-primary">{score?.total_pontos || 0}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs text-muted-foreground">Placar exato ✅</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{score?.acertos_exatos || 0}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs text-muted-foreground">Resultado 👍</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{score?.acertos_resultado || 0}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs text-muted-foreground">Palpites</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{totalPredictions}</CardContent>
        </Card>
      </section>

      {/* Ações */}
      <section className="flex flex-wrap gap-3">
        <Link href="/rodada">
          <Button>⚽ Fazer palpites</Button>
        </Link>
        <Link href="/palpites">
          <Button variant="outline">👀 Ver palpites da galera</Button>
        </Link>
      </section>

      {/* Ranking */}
      {ranking && ranking.length > 0 ? (
        <section className="space-y-4">
          <RankingRace ranking={normalizedRanking} />
          <RankingTable ranking={normalizedRanking} title="Classificação detalhada" />
        </section>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Nenhum participante ainda — seja o primeiro!
          </CardContent>
        </Card>
      )}
    </div>
  )
}
