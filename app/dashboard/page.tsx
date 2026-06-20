import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createSupabaseServerClient } from "@/lib/supabase"
import { RankingAoVivo } from "@/components/RankingAoVivo"
import { unstable_noStore as noStore } from "next/cache"
import { RankingTable } from "@/components/RankingTable"
import { CaixaTransparente } from "@/components/CaixaTransparente"
import { BotaoPagamento } from "@/components/BotaoPagamento"
import { Score } from "@/types"
import { BannerCorrecao } from "@/components/BannerCorrecao"

export default async function DashboardPage() {
  noStore() // sempre buscar dados frescos — nunca servir cache
  const supabase = createSupabaseServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [{ data: profile }, { data: score }, predResult, { data: ranking }, { data: pagamentos }, { data: meuPagamento }, { data: todosPalpites }, { data: jogosBanco }] = await Promise.all([
    // profile inclui correcao_lida agora
    supabase.from("profiles").select("nome, correcao_lida").eq("id", user.id).single(),
    supabase.from("scores").select("total_pontos,acertos_exatos,acertos_resultado,total_palpites").eq("user_id", user.id).maybeSingle(),
    supabase.from("predictions").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    // Busca todos que palpitaram, com scores se existirem
    supabase.from("profiles")
      .select("id,nome,avatar_url,scores(total_pontos,acertos_exatos,acertos_resultado,total_palpites)")
      .order("nome", { ascending: true }),
    supabase.from("registrations").select("valor_pago,status").eq("status", "paid"),
    supabase.from("registrations").select("id,status").eq("user_id", user.id).eq("status", "paid").maybeSingle(),
    // Palpites de todos para o ranking ao vivo
    supabase.from("predictions").select("user_id,game_id,palpite_casa,palpite_fora"),
    supabase.from("games").select("id,time_casa,time_fora,status").neq("status","cancelled")
  ])

  const totalPredictions = predResult.count ?? 0
  const totalArrecadado = (pagamentos || []).reduce((sum, r) => sum + (r.valor_pago || 0), 0)
  const jaPagou = !!meuPagamento
  const profileEmail = user.email || ""
  const totalParticipantes = (ranking || []).length

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

  // Monta participantes para o ranking ao vivo (depois de normalizedRanking)
  const participantesAoVivo = normalizedRanking.map(p => ({
    user_id: p.user_id,
    nome: p.profiles?.nome || "?",
    avatar_url: p.profiles?.avatar_url,
    pontos_fixos: p.total_pontos,
    palpites: (todosPalpites || []).filter(t => t.user_id === p.user_id).map(t => ({
      game_id: t.game_id,
      palpite_casa: t.palpite_casa,
      palpite_fora: t.palpite_fora,
    })),
  }))

  return (
    <div className="space-y-6">
      {/* Banner correção — some após o usuário clicar em "Li e entendi" */}
      {!(profile as any)?.correcao_lida && (
        <BannerCorrecao userId={user.id} />
      )}

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

      {/* Caixa transparente */}
      <CaixaTransparente
        totalArrecadado={totalArrecadado}
        totalParticipantes={totalParticipantes}
        jogosDoDia11e12Gratis={true}
      />

      {/* Ações */}
      <section className="flex flex-wrap items-center gap-3">
        <Link href="/rodada">
          <Button>⚽ Fazer palpites</Button>
        </Link>
        <Link href="/palpites">
          <Button variant="outline">👀 Ver palpites da galera</Button>
        </Link>
        <Link href="/correcao">
          <Button variant="outline">📋 Meus palpites</Button>
        </Link>
        <BotaoPagamento jaPagou={jaPagou} />
      </section>

      {/* Ranking */}
      {ranking && ranking.length > 0 ? (
        <section className="space-y-4">
          <RankingAoVivo
            participantes={participantesAoVivo}
            jogosBanco={(jogosBanco || []) as { id: string; time_casa: string; time_fora: string; status: string }[]}
          />
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
