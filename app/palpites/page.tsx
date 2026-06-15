import { createSupabaseServerClient } from "@/lib/supabase"
import { PalpitesClient } from "./PalpitesClient"

function getOutcome(c: number, f: number) {
  if (c > f) return "casa"
  if (f > c) return "fora"
  return "empate"
}

export default async function PalpitesPage() {
  const supabase = createSupabaseServerClient()

  const [{ data: games }, { data: predictions }] = await Promise.all([
    supabase
      .from("games")
      .select("id,time_casa,time_fora,bandeira_casa,bandeira_fora,data_jogo,placar_casa,placar_fora,status")
      .neq("status", "cancelled")
      .order("data_jogo", { ascending: true }),
    supabase
      .from("predictions")
      .select("game_id,palpite_casa,palpite_fora,user_id,profiles(nome,avatar_url)")
      .order("user_id"),
  ])

  // Agrupa palpites por jogo
  const predByGame = new Map<string, { nome: string; palpite_casa: number; palpite_fora: number }[]>()
  for (const p of predictions || []) {
    const profile = p.profiles as unknown as { nome: string; avatar_url?: string } | null
    const arr = predByGame.get(p.game_id) || []
    arr.push({ nome: profile?.nome || "?", palpite_casa: p.palpite_casa, palpite_fora: p.palpite_fora })
    predByGame.set(p.game_id, arr)
  }

  // Monta jogos com palpites enriquecidos
  const jogos = (games || [])
    .filter(g => (predByGame.get(g.id) || []).length > 0)
    .map(g => {
      const dt = new Date(g.data_jogo)
      const dataLabel = dt.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", year: "numeric" })
      const horaLabel = dt.toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" })

      const palpites = (predByGame.get(g.id) || []).map(p => {
        let acerto: "exato" | "resultado" | null = null
        if (g.status === "finished" && g.placar_casa !== null && g.placar_fora !== null) {
          if (p.palpite_casa === g.placar_casa && p.palpite_fora === g.placar_fora) {
            acerto = "exato"
          } else if (getOutcome(p.palpite_casa, p.palpite_fora) === getOutcome(g.placar_casa, g.placar_fora)) {
            acerto = "resultado"
          }
        }
        return { ...p, acerto }
      })

      return {
        id: g.id,
        time_casa: g.time_casa,
        time_fora: g.time_fora,
        bandeira_casa: g.bandeira_casa ?? "",
        bandeira_fora: g.bandeira_fora ?? "",
        data_jogo: g.data_jogo,
        placar_casa: g.placar_casa ?? null,
        placar_fora: g.placar_fora ?? null,
        status: g.status,
        dataLabel,
        horaLabel,
        palpites,
      }
    })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary">⚽ Palpites da Galera</h1>
        <p className="text-muted-foreground text-sm mt-1">Veja o que todo mundo apostou em cada jogo.</p>
      </div>
      <PalpitesClient jogos={jogos} />
    </div>
  )
}
