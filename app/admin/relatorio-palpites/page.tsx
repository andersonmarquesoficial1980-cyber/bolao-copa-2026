import { createSupabaseServerClient } from "@/lib/supabase"
import { redirect } from "next/navigation"
import Link from "next/link"
import { PrintButton } from "@/components/PrintButton"

function getOutcome(c: number, f: number) {
  if (c > f) return "casa"
  if (f > c) return "fora"
  return "empate"
}

function calcPoints(pC: number, pF: number, rC: number, rF: number): number {
  if (pC === rC && pF === rF) return 3
  if (getOutcome(pC, pF) === getOutcome(rC, rF)) return 1
  return 0
}

export default async function RelatorioPage() {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const [
    { data: allProfiles },
    { data: allPredictions },
    { data: allGames },
    { data: allScores },
  ] = await Promise.all([
    supabase.from("profiles").select("id, nome, email").order("nome"),
    supabase.from("predictions").select("*"),
    supabase.from("games").select("*").eq("status", "finished").order("data_jogo"),
    supabase.from("scores").select("*"),
  ])

  const profiles = allProfiles || []
  const predictions = allPredictions || []
  const games = allGames || []
  const scoresMap = Object.fromEntries((allScores || []).map(s => [s.user_id, s]))
  const finishedMap = Object.fromEntries(games.map(g => [g.id, g]))

  // Monta dados por usuário
  const usuarios = profiles.map(p => {
    const meusPalpites = predictions
      .filter(pred => pred.user_id === p.id && finishedMap[pred.game_id])
      .map(pred => {
        const g = finishedMap[pred.game_id]
        const pts = calcPoints(pred.palpite_casa, pred.palpite_fora, g.placar_casa, g.placar_fora)
        return { ...pred, game: g, pts }
      })
      .sort((a, b) => new Date(a.game.data_jogo).getTime() - new Date(b.game.data_jogo).getTime())

    const score = scoresMap[p.id]
    const totalPts = score?.total_pontos ?? 0
    const exatos = score?.acertos_exatos ?? 0
    const resultado = score?.acertos_resultado ?? 0

    return { ...p, palpites: meusPalpites, totalPts, exatos, resultado }
  })

  // Ranking
  const ranking = [...usuarios].sort((a, b) => b.totalPts - a.totalPts || b.exatos - a.exatos)

  const dataGeracao = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })

  return (
    <>
      <div className="print:hidden mb-6 flex items-center gap-4">
        <Link href="/admin" className="text-sm text-muted-foreground hover:underline">← Painel admin</Link>
        <div className="ml-auto"><PrintButton /></div>
      </div>

      <div className="space-y-10 max-w-4xl mx-auto">
        {/* Cabeçalho do relatório */}
        <div className="border-b pb-4 space-y-1">
          <h1 className="text-2xl font-bold">⚽ Relatório de Palpites — Bolão Copa 2026</h1>
          <p className="text-sm text-muted-foreground">Gerado em {dataGeracao} · {games.length} jogo{games.length !== 1 ? "s" : ""} encerrado{games.length !== 1 ? "s" : ""} · {profiles.length} participantes</p>
        </div>

        {/* Classificação geral */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold">Classificação Geral</h2>
          <table className="w-full text-sm border rounded-xl overflow-hidden">
            <thead className="bg-muted">
              <tr>
                <th className="px-3 py-2 text-center w-10">#</th>
                <th className="px-3 py-2 text-left">Nome</th>
                <th className="px-3 py-2 text-center">Pts</th>
                <th className="px-3 py-2 text-center">✅ Exatos</th>
                <th className="px-3 py-2 text-center">⚽ Resultado</th>
                <th className="px-3 py-2 text-center">Palpites</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((u, i) => (
                <tr key={u.id} className={i % 2 === 0 ? "bg-white" : "bg-muted/30"}>
                  <td className="px-3 py-2 text-center text-muted-foreground font-medium">
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                  </td>
                  <td className="px-3 py-2 font-medium">{u.nome}</td>
                  <td className="px-3 py-2 text-center font-bold">{u.totalPts}</td>
                  <td className="px-3 py-2 text-center">{u.exatos}</td>
                  <td className="px-3 py-2 text-center">{u.resultado}</td>
                  <td className="px-3 py-2 text-center text-muted-foreground">{u.palpites.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Palpites por usuário */}
        <section className="space-y-8">
          <h2 className="text-lg font-bold">Palpites por Participante</h2>
          {ranking.map((u, uIdx) => (
            <div key={u.id} className="space-y-2 break-inside-avoid">
              <div className="flex items-baseline gap-3">
                <span className="font-bold text-base">{uIdx + 1}º — {u.nome}</span>
                <span className="text-sm text-muted-foreground">{u.totalPts} pts · {u.exatos} exatos · {u.resultado} resultado</span>
              </div>
              {u.palpites.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">Nenhum palpite nos jogos encerrados.</p>
              ) : (
                <table className="w-full text-sm border rounded-lg overflow-hidden">
                  <thead className="bg-muted/60">
                    <tr>
                      <th className="px-3 py-1.5 text-left font-medium">Jogo</th>
                      <th className="px-3 py-1.5 text-center font-medium">Resultado</th>
                      <th className="px-3 py-1.5 text-center font-medium">Palpite</th>
                      <th className="px-3 py-1.5 text-center font-medium">Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {u.palpites.map((p, i) => {
                      const icon = p.pts === 3 ? "✅" : p.pts === 1 ? "⚽" : "❌"
                      return (
                        <tr key={p.id} className={i % 2 === 0 ? "bg-white" : "bg-muted/20"}>
                          <td className="px-3 py-1.5">
                            {p.game.bandeira_casa} {p.game.time_casa} <span className="text-muted-foreground">vs</span> {p.game.time_fora} {p.game.bandeira_fora}
                          </td>
                          <td className="px-3 py-1.5 text-center font-bold">{p.game.placar_casa}–{p.game.placar_fora}</td>
                          <td className="px-3 py-1.5 text-center text-muted-foreground">{p.palpite_casa}–{p.palpite_fora}</td>
                          <td className="px-3 py-1.5 text-center font-bold">{icon} {p.pts}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot className="bg-muted/60 font-semibold">
                    <tr>
                      <td colSpan={3} className="px-3 py-1.5 text-right">Total</td>
                      <td className="px-3 py-1.5 text-center">{u.totalPts}</td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          ))}
        </section>

        <p className="text-xs text-center text-muted-foreground pb-6 print:block">
          ✅ Placar exato = 3 pts · ⚽ Acerto de resultado = 1 pt · ❌ Erro = 0 pts<br />
          Bolão Copa 2026 – Fremix · Gerado em {dataGeracao}
        </p>
      </div>
    </>
  )
}


