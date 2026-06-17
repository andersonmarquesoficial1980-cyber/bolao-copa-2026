import { createSupabaseServerClient } from "@/lib/supabase"
import { redirect } from "next/navigation"
import { FlagImg } from "@/components/FlagImg"

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

export default async function MeusPalpitesPage() {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const [
    { data: profile },
    { data: meusScore },
    { data: predictions },
    { data: games },
    { data: allScores },
    { data: allProfiles },
  ] = await Promise.all([
    supabase.from("profiles").select("nome").eq("id", user.id).single(),
    supabase.from("scores").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("predictions").select("*").eq("user_id", user.id),
    supabase.from("games").select("*").eq("status", "finished").order("data_jogo"),
    supabase.from("scores").select("*"),
    supabase.from("profiles").select("id, nome"),
  ])

  const finishedMap = Object.fromEntries((games || []).map(g => [g.id, g]))
  const profileMap = Object.fromEntries((allProfiles || []).map(p => [p.id, p.nome]))

  const meusPalpites = (predictions || [])
    .filter(p => finishedMap[p.game_id])
    .map(p => {
      const g = finishedMap[p.game_id]
      const pts = calcPoints(p.palpite_casa, p.palpite_fora, g.placar_casa, g.placar_fora)
      return { ...p, game: g, pts }
    })
    .sort((a, b) => new Date(a.game.data_jogo).getTime() - new Date(b.game.data_jogo).getTime())

  const totalPts = meusPalpites.reduce((s, p) => s + p.pts, 0)
  const exatos = meusPalpites.filter(p => p.pts === 3).length
  const acertosResultado = meusPalpites.filter(p => p.pts === 1).length
  const erros = meusPalpites.filter(p => p.pts === 0).length

  const rankingCorrigido = (allScores || [])
    .map(s => ({
      nome: profileMap[s.user_id] || "?",
      pontos: s.total_pontos,
      exatos: s.acertos_exatos,
      resultado: s.acertos_resultado,
      user_id: s.user_id,
    }))
    .sort((a, b) => b.pontos - a.pontos || b.exatos - a.exatos)

  const minhaPos = rankingCorrigido.findIndex(r => r.user_id === user.id) + 1
  const totalJogos = (games || []).length

  return (
    <div className="mx-auto max-w-2xl space-y-8 py-4">

      {/* Cabeçalho */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">📋 Meus Palpites — {profile?.nome}</h1>
        <p className="text-sm text-muted-foreground">
          {totalJogos} jogo{totalJogos !== 1 ? "s" : ""} encerrado{totalJogos !== 1 ? "s" : ""} · você está em <strong>{minhaPos}º lugar</strong>
        </p>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Pontos", value: totalPts, color: "text-primary" },
          { label: "✅ Exatos", value: exatos, color: "" },
          { label: "⚽ Resultado", value: acertosResultado, color: "" },
          { label: "❌ Erros", value: erros, color: "" },
        ].map(c => (
          <div key={c.label} className="rounded-xl border p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">{c.label}</p>
            <p className={`text-3xl font-bold ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Tabela de palpites */}
      <div className="space-y-2">
        <h2 className="font-semibold">Seus palpites jogo a jogo</h2>
        {meusPalpites.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum palpite nos jogos encerrados ainda.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border text-sm">
            <table className="w-full min-w-[320px]">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th className="px-2 py-2 text-left font-medium">Jogo</th>
                  <th className="px-2 py-2 text-center font-medium whitespace-nowrap">Resultado</th>
                  <th className="px-2 py-2 text-center font-medium whitespace-nowrap">Palpite</th>
                  <th className="px-2 py-2 text-center font-medium w-10">Pts</th>
                </tr>
              </thead>
              <tbody>
                {meusPalpites.map((p, i) => {
                  const g = p.game
                  const icon = p.pts === 3 ? "✅" : p.pts === 1 ? "⚽" : "❌"
                  return (
                    <tr key={p.id} className={i % 2 === 0 ? "bg-white" : "bg-muted/30"}>
                      <td className="px-2 py-2">
                        <div className="font-medium leading-tight flex items-center gap-1">
                          <FlagImg emoji={g.bandeira_casa} size="16" className="w-4 h-3 rounded-sm" />
                          {g.time_casa}
                        </div>
                        <div className="text-muted-foreground text-xs flex items-center gap-1">
                          vs <FlagImg emoji={g.bandeira_fora} size="16" className="w-4 h-3 rounded-sm" /> {g.time_fora}
                        </div>
                      </td>
                      <td className="px-2 py-2 text-center font-bold whitespace-nowrap">{g.placar_casa}–{g.placar_fora}</td>
                      <td className="px-2 py-2 text-center text-muted-foreground whitespace-nowrap">{p.palpite_casa}–{p.palpite_fora}</td>
                      <td className="px-2 py-2 text-center font-bold">{icon} {p.pts}</td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot className="bg-muted font-bold">
                <tr>
                  <td colSpan={3} className="px-2 py-2 text-right">Total</td>
                  <td className="px-2 py-2 text-center">{totalPts}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          ✅ Placar exato = 3 pts &nbsp;|&nbsp; ⚽ Acerto de resultado = 1 pt &nbsp;|&nbsp; ❌ Erro = 0 pts
        </p>
      </div>

      {/* Classificação */}
      <div className="space-y-3">
        <h2 className="font-semibold">Classificação geral</h2>
        <div className="overflow-hidden rounded-xl border text-sm">
          <table className="w-full">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-center font-medium w-10">#</th>
                <th className="px-3 py-2 text-left font-medium">Nome</th>
                <th className="px-3 py-2 text-center font-medium">Pts</th>
                <th className="px-3 py-2 text-center font-medium">✅</th>
                <th className="px-3 py-2 text-center font-medium">⚽</th>
              </tr>
            </thead>
            <tbody>
              {rankingCorrigido.map((r, i) => {
                const isMe = r.user_id === user.id
                return (
                  <tr
                    key={r.user_id}
                    className={
                      isMe
                        ? "bg-yellow-50 font-semibold border-l-4 border-yellow-400"
                        : i % 2 === 0 ? "bg-white" : "bg-muted/30"
                    }
                  >
                    <td className="px-3 py-2 text-center text-muted-foreground">
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                    </td>
                    <td className="px-3 py-2">{r.nome}{isMe ? " 👈" : ""}</td>
                    <td className="px-3 py-2 text-center font-bold">{r.pontos}</td>
                    <td className="px-3 py-2 text-center">{r.exatos}</td>
                    <td className="px-3 py-2 text-center">{r.resultado}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
