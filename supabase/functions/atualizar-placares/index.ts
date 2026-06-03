/**
 * Edge Function: atualizar-placares
 * Roda via cron a cada 15 minutos.
 * Busca jogos finalizados na API worldcupjson.net e atualiza o banco.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const supabaseUrl = Deno.env.get("SUPABASE_URL")!
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

const supabase = createClient(supabaseUrl, serviceKey)

// Mapeamento de nomes em inglês (API) → português (banco)
const TEAM_MAP: Record<string, string> = {
  "Brazil": "Brasil",
  "France": "França",
  "Germany": "Alemanha",
  "Argentina": "Argentina",
  "Spain": "Espanha",
  "England": "Inglaterra",
  "Portugal": "Portugal",
  "Italy": "Itália",
  "Netherlands": "Holanda",
  "Belgium": "Bélgica",
  "Uruguay": "Uruguai",
  "Colombia": "Colômbia",
  "Mexico": "México",
  "USA": "EUA",
  "United States": "EUA",
  "Croatia": "Croácia",
  "Denmark": "Dinamarca",
  "Serbia": "Sérvia",
  "Morocco": "Marrocos",
  "Senegal": "Senegal",
  "Switzerland": "Suíça",
  "Norway": "Noruega",
  "Australia": "Austrália",
  "Japan": "Japão",
  "South Korea": "Coreia do Sul",
  "Ecuador": "Equador",
  "Ghana": "Gana",
  "Turkey": "Turquia",
  "Iran": "Irã",
  "Scotland": "Escócia",
  "Honduras": "Honduras",
  "Costa Rica": "Costa Rica",
  "Saudi Arabia": "Arábia Saudita",
  "New Zealand": "Nova Zelândia",
  "Panama": "Panamá",
  "Kazakhstan": "Cazaquistão",
  "Venezuela": "Venezuela",
  "Cameroon": "Camarões",
  "DR Congo": "Congo",
  "Egypt": "Egito",
  "Kyrgyzstan": "Quirguistão",
  "Indonesia": "Indonésia",
  "Peru": "Peru",
  "Slovakia": "Eslováquia",
  "Czech Republic": "República Tcheca",
  "Equatorial Guinea": "Guiné Equatorial",
  "Dominican Republic": "Rep. Dominicana",
  "Tunisia": "Tunísia",
}

function normalizeTeam(name: string): string {
  return TEAM_MAP[name] || name
}

Deno.serve(async () => {
  try {
    // Buscar jogos no banco que estão como 'scheduled' ou 'live' e já deveriam ter terminado
    const agora = new Date()
    const duasHorasAtras = new Date(agora.getTime() - 2 * 60 * 60 * 1000)

    const { data: jogosParaVerificar, error: dbError } = await supabase
      .from("games")
      .select("id, time_casa, time_fora, data_jogo, status")
      .in("status", ["scheduled", "live"])
      .lt("data_jogo", duasHorasAtras.toISOString())
      .order("data_jogo", { ascending: true })

    if (dbError) throw dbError
    if (!jogosParaVerificar || jogosParaVerificar.length === 0) {
      return new Response(JSON.stringify({ message: "Nenhum jogo para verificar", ts: agora.toISOString() }), {
        headers: { "Content-Type": "application/json" }
      })
    }

    // Buscar resultados da API Copa 2026
    const apiRes = await fetch("https://worldcupjson.net/matches")
    if (!apiRes.ok) throw new Error("Falha ao buscar API worldcupjson.net")
    const apiMatches = await apiRes.json() as Array<{
      status: string
      home_team: { name: string; goals: number }
      away_team: { name: string; goals: number }
      datetime: string
    }>

    const finalizados = apiMatches.filter(m => m.status === "completed")

    let atualizados = 0
    let pontuados = 0

    for (const jogo of jogosParaVerificar) {
      // Encontrar correspondência na API pelo nome dos times
      const match = finalizados.find(m => {
        const homePt = normalizeTeam(m.home_team.name)
        const awayPt = normalizeTeam(m.away_team.name)
        return (
          (homePt === jogo.time_casa && awayPt === jogo.time_fora) ||
          (homePt === jogo.time_fora && awayPt === jogo.time_casa)
        )
      })

      if (!match) continue

      const placarCasa = match.home_team.name === jogo.time_casa
        ? match.home_team.goals
        : match.away_team.goals
      const placarFora = match.home_team.name === jogo.time_fora
        ? match.home_team.goals
        : match.away_team.goals

      // Atualizar placar e status
      const { error: updateError } = await supabase
        .from("games")
        .update({
          placar_casa: placarCasa,
          placar_fora: placarFora,
          status: "finished"
        })
        .eq("id", jogo.id)

      if (updateError) {
        console.error(`Erro ao atualizar jogo ${jogo.id}:`, updateError)
        continue
      }

      atualizados++

      // Calcular pontuações
      const { error: rpcError } = await supabase
        .rpc("atualizar_scores_jogo", { p_game_id: jogo.id })

      if (rpcError) {
        console.error(`Erro ao calcular scores jogo ${jogo.id}:`, rpcError)
      } else {
        pontuados++
      }
    }

    return new Response(
      JSON.stringify({
        message: "OK",
        verificados: jogosParaVerificar.length,
        atualizados,
        pontuados,
        ts: agora.toISOString()
      }),
      { headers: { "Content-Type": "application/json" } }
    )
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    })
  }
})
