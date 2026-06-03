import Link from "next/link"
import { CountdownTimer } from "@/components/CountdownTimer"
import { RankingTable } from "@/components/RankingTable"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createSupabaseServerClient } from "@/lib/supabase"
import { formatCurrency } from "@/lib/utils"
import { PrizeConfig, Score } from "@/types"

export default async function LandingPage() {
  const supabase = createSupabaseServerClient()

  const [{ data: ranking }, { data: nextGame }, { data: config }] = await Promise.all([
    supabase
      .from("scores")
      .select("user_id,total_pontos,acertos_exatos,acertos_resultado,total_palpites,profiles(nome,avatar_url)")
      .order("total_pontos", { ascending: false })
      .limit(10),
    supabase
      .from("games")
      .select("id,data_jogo,time_casa,time_fora")
      .eq("status", "scheduled")
      .gt("data_jogo", new Date().toISOString())
      .order("data_jogo", { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase.from("prize_config").select("*").limit(1).maybeSingle()
  ])

  const rankingData = (ranking || []) as unknown as Score[]
  const prize = config as PrizeConfig | null

  return (
    <div className="space-y-8">
      <section className="grid gap-6 rounded-2xl border border-border bg-white/80 p-6 shadow-sm md:grid-cols-[1.2fr_1fr] md:p-8">
        <div className="space-y-4">
          <p className="inline-block rounded-full bg-secondary px-3 py-1 text-xs font-semibold uppercase text-secondary-foreground">
            Temporada Copa 2026
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight text-primary md:text-4xl">
            Bolão Copa 2026: dispute com a galera e suba no ranking
          </h1>
          <p className="text-muted-foreground">
            Faça palpites por rodada, acumule pontos automaticamente e acompanhe a classificação em tempo real.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link href="/auth/cadastro">
              <Button size="lg">Quero participar</Button>
            </Link>
            <Link href="/ranking">
              <Button variant="outline" size="lg">
                Ver ranking completo
              </Button>
            </Link>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Próxima partida</CardTitle>
            <CardDescription>Contagem regressiva para encerrar palpites</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {nextGame ? (
              <>
                <p className="text-lg font-semibold">
                  {nextGame.time_casa} x {nextGame.time_fora}
                </p>
                <CountdownTimer targetDate={nextGame.data_jogo} />
              </>
            ) : (
              <p className="text-muted-foreground">Não há partidas agendadas no momento.</p>
            )}

            {prize && (
              <div className="rounded-lg bg-muted p-3 text-sm">
                <p className="font-semibold">Inscrição: {formatCurrency(prize.valor_inscricao)}</p>
                <p>
                  Premiação: {prize.percentual_1lugar}% / {prize.percentual_2lugar}% / {prize.percentual_3lugar}%
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section>
        {rankingData.length > 0 ? (
          <RankingTable ranking={rankingData} title="Top 10 do Bolão" />
        ) : (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              Ainda não há pontuações calculadas. Assim que os resultados forem lançados, o ranking aparecerá aqui.
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  )
}
