import { createSupabaseServerClient } from "@/lib/supabase"
import { redirect } from "next/navigation"

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

export default async function CorrecaoPage() {
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
    supabase.from("games").select("*").eq("status", "finished"),
    supabase.from("scores").select("*"),
    supabase.from("profiles").select("id, nome"),
  ])

  const finishedMap = Object.fromEntries((games || []).map(g => [g.id, g]))
  const profileMap = Object.fromEntries((allProfiles || []).map(p => [p.id, p.nome]))

  // Meus palpites nos jogos encerrados
  const meusPalpites = (predictions || [])
    .filter(p => finishedMap[p.game_id])
    .map(p => {
      const g = finishedMap[p.game_id]
      const pts = calcPoints(p.palpite_casa, p.palpite_fora, g.placar_casa, g.placar_fora)
      return { ...p, game: g, pts_correto: pts }
    })
    .sort((a, b) => new Date(a.game.data_jogo).getTime() - new Date(b.game.data_jogo).getTime())

  const ptsTotaisCorretos = meusPalpites.reduce((s, p) => s + p.pts_correto, 0)
  const ptsTotaisAntigos = meusScore?.total_pontos ?? 0 // já corrigido — vamos mostrar o novo

  // Classificação geral corrigida
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

  return (
    <div className="mx-auto max-w-2xl space-y-8 py-4">
      {/* Cabeçalho */}
      <div className="rounded-xl border border-yellow-400 bg-yellow-50 p-5 space-y-2">
        <h1 className="text-2xl font-bold text-yellow-900">⚠️ Correção de Pontuação</h1>
        <p className="text-yellow-800 text-sm leading-relaxed">
          Identificamos um erro no sistema de cálculo de pontos. A função responsável por calcular
          os pontos estava usando valores incorretos: <strong>acerto exato valia 10 pontos</strong> e{" "}
          <strong>acerto de resultado valia 5 ou 7 pontos</strong>, quando as regras do bolão definem
          corretamente <strong>3 pontos para placar exato</strong> e{" "}
          <strong>1 ponto para acerto de resultado</strong>.
        </p>
        <p className="text-yellow-800 text-sm leading-relaxed">
          O erro foi identificado e corrigido em <strong>15/06/2026</strong>. Todos os palpites
          dos 12 jogos realizados até esta data foram recalculados e a classificação foi atualizada.
          Pedimos desculpas pelo transtorno.
        </p>
      </div>

      {/* Meu resumo */}
      <div className="space-y-3">
        <h2 className="text-xl font-bold">Seus palpites — {profile?.nome}</h2>
        <p className="text-sm text-muted-foreground">
          Você está em <strong>{minhaPos}º lugar</strong> com <strong>{ptsTotaisCorretos} ponto{ptsTotaisCorretos !== 1 ? "s" : ""}</strong>.
        </p>

        {meusPalpites.length === 0 ? (
          <p className="text-sm text-muted-foreground">Você não fez palpites nos jogos encerrados.</p>
        ) : (
          <div className="overflow-hidden rounded-xl border text-sm">
            <table className="w-full">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Jogo</th>
                  <th className="px-3 py-2 text-center font-medium">Resultado</th>
                  <th className="px-3 py-2 text-center font-medium">Seu palpite</th>
                  <th className="px-3 py-2 text-center font-medium">Pts</th>
                </tr>
              </thead>
              <tbody>
                {meusPalpites.map((p, i) => {
                  const g = p.game
                  const icon = p.pts_correto === 3 ? "✅" : p.pts_correto === 1 ? "⚽" : "❌"
                  return (
                    <tr key={p.id} className={i % 2 === 0 ? "bg-white" : "bg-muted/30"}>
                      <td className="px-3 py-2">
                        <span className="font-medium">{g.bandeira_casa} {g.time_casa}</span>
                        <span className="text-muted-foreground mx-1">vs</span>
                        <span className="font-medium">{g.time_fora} {g.bandeira_fora}</span>
                      </td>
                      <td className="px-3 py-2 text-center font-bold">
                        {g.placar_casa} – {g.placar_fora}
                      </td>
                      <td className="px-3 py-2 text-center text-muted-foreground">
                        {p.palpite_casa} – {p.palpite_fora}
                      </td>
                      <td className="px-3 py-2 text-center font-bold">
                        {icon} {p.pts_correto}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot className="bg-muted font-bold">
                <tr>
                  <td colSpan={3} className="px-3 py-2 text-right">Total</td>
                  <td className="px-3 py-2 text-center">{ptsTotaisCorretos}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          ✅ Placar exato = 3 pts &nbsp;|&nbsp; ⚽ Acerto de resultado = 1 pt &nbsp;|&nbsp; ❌ Erro = 0 pts
        </p>
      </div>

      {/* Classificação geral */}
      <div className="space-y-3">
        <h2 className="text-xl font-bold">Classificação geral atualizada</h2>
        <div className="overflow-hidden rounded-xl border text-sm">
          <table className="w-full">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-center font-medium w-10">#</th>
                <th className="px-3 py-2 text-left font-medium">Nome</th>
                <th className="px-3 py-2 text-center font-medium">Pts</th>
                <th className="px-3 py-2 text-center font-medium">✅ Exatos</th>
                <th className="px-3 py-2 text-center font-medium">⚽ Resultado</th>
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
                        : i % 2 === 0
                        ? "bg-white"
                        : "bg-muted/30"
                    }
                  >
                    <td className="px-3 py-2 text-center text-muted-foreground">
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                    </td>
                    <td className="px-3 py-2">{r.nome}{isMe ? " (você)" : ""}</td>
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

      <p className="text-xs text-center text-muted-foreground pb-4">
        Correção aplicada em 15/06/2026 · Bolão Copa 2026 – Fremix
      </p>
    </div>
  )
}
