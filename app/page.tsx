export const revalidate = 0

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
          <div className="flex items-center gap-2">
            <span className="inline-block rounded-sm bg-[#E03020] px-3 py-1 text-xs font-bold uppercase tracking-widest text-white">
              Fremix
            </span>
            <span className="text-xs font-semibold text-[#1B3A8C] uppercase tracking-widest">Copa 2026 ⚽</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-[#1B3A8C] md:text-4xl">
            Bolão Copa do Mundo 2026
          </h1>
          <p className="text-gray-500">
            Dispute com os colegas da Fremix. Palpite os placares, acumule pontos e concorra ao prêmio.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link href="/auth/cadastro">
              <Button size="lg" className="bg-[#E03020] hover:bg-[#c02818] text-white">Quero participar</Button>
            </Link>
            <Link href="/ranking">
              <Button variant="outline" size="lg" className="border-[#1B3A8C] text-[#1B3A8C] hover:bg-[#1B3A8C] hover:text-white">
                Ver ranking
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
