import { createSupabaseServerClient } from "@/lib/supabase"
import { formatDate } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default async function PalpitesPage() {
  const supabase = createSupabaseServerClient()

  // Busca todos os jogos com todos os palpites
  const { data: games } = await supabase
    .from("games")
    .select("id,time_casa,time_fora,bandeira_casa,bandeira_fora,data_jogo,placar_casa,placar_fora,status")
    .neq("status", "cancelled")
    .order("data_jogo", { ascending: true })

  const { data: predictions } = await supabase
    .from("predictions")
    .select("game_id,palpite_casa,palpite_fora,user_id,profiles(nome,avatar_url)")
    .order("user_id")

  // Agrupa palpites por jogo
  const predByGame = new Map<string, { nome: string; avatar_url?: string; palpite_casa: number; palpite_fora: number }[]>()
  for (const p of predictions || []) {
    const profile = p.profiles as unknown as { nome: string; avatar_url?: string } | null
    const arr = predByGame.get(p.game_id) || []
    arr.push({
      nome: profile?.nome || "?",
      avatar_url: profile?.avatar_url,
      palpite_casa: p.palpite_casa,
      palpite_fora: p.palpite_fora,
    })
    predByGame.set(p.game_id, arr)
  }

  const gamesWithPalpites = (games || []).filter(g => (predByGame.get(g.id) || []).length > 0)

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-primary">⚽ Palpites da Galera</h1>
      <p className="text-muted-foreground text-sm">Veja o que todo mundo apostou em cada jogo.</p>

      {gamesWithPalpites.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Nenhum palpite ainda. Seja o primeiro!
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {gamesWithPalpites.map(game => {
          const palpites = predByGame.get(game.id) || []
          const finished = game.status === "finished"

          return (
            <Card key={game.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <CardTitle className="text-base">
                    {game.bandeira_casa} {game.time_casa} × {game.time_fora} {game.bandeira_fora}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {finished && game.placar_casa !== null && (
                      <span className="text-sm font-bold text-primary">
                        Resultado: {game.placar_casa}–{game.placar_fora}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">{formatDate(game.data_jogo)}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="divide-y">
                  {palpites.map((p, i) => {
                    // Verifica acerto se jogo finalizado
                    let acerto = null
                    if (finished && game.placar_casa !== null) {
                      if (p.palpite_casa === game.placar_casa && p.palpite_fora === game.placar_fora) {
                        acerto = "exato"
                      } else {
                        const resCasa = Math.sign(game.placar_casa! - game.placar_fora!)
                        const resPalpite = Math.sign(p.palpite_casa - p.palpite_fora)
                        if (resCasa === resPalpite) acerto = "resultado"
                      }
                    }

                    return (
                      <div key={i} className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                              {p.nome.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                            {p.avatar_url && <AvatarFallback>{p.nome.slice(0,2).toUpperCase()}</AvatarFallback>}
                          </Avatar>
                          <span className="font-medium text-sm">{p.nome}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold">
                            {p.palpite_casa} × {p.palpite_fora}
                          </span>
                          {acerto === "exato" && <Badge className="bg-green-500 text-white text-xs">✅ Exato</Badge>}
                          {acerto === "resultado" && <Badge className="bg-blue-500 text-white text-xs">👍 Resultado</Badge>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
