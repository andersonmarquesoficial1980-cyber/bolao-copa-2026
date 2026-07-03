/**
 * Edge Function: atualizar-placares
 * Roda via cron a cada 15 minutos.
 * Busca jogos finalizados na API ESPN e atualiza o banco.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const supabaseUrl = Deno.env.get("SUPABASE_URL")!
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

const supabase = createClient(supabaseUrl, serviceKey)

// Mapeamento nomes ESPN (inglês) → banco (português)
const TEAM_MAP: Record<string, string> = {
  "Mexico": "México",
  "South Africa": "África do Sul",
  "Czechia": "República Tcheca",
  "South Korea": "Coreia do Sul",
  "Canada": "Canadá",
  "Bosnia-Herzegovina": "Bósnia",
  "Switzerland": "Suíça",
  "Qatar": "Catar",
  "United States": "EUA",
  "Paraguay": "Paraguai",
  "Australia": "Austrália",
  "Türkiye": "Turquia",
  "Germany": "Alemanha",
  "Curaçao": "Curaçao",
  "Netherlands": "Holanda",
  "Japan": "Japão",
  "Ivory Coast": "Costa do Marfim",
  "Ecuador": "Equador",
  "Sweden": "Suécia",
  "Tunisia": "Tunísia",
  "Spain": "Espanha",
  "Cape Verde": "Cabo Verde",
  "Belgium": "Bélgica",
  "Egypt": "Egito",
  "Saudi Arabia": "Arábia Saudita",
  "Uruguay": "Uruguai",
  "Iran": "Irã",
  "New Zealand": "Nova Zelândia",
  "France": "França",
  "Senegal": "Senegal",
  "Iraq": "Iraque",
  "Norway": "Noruega",
  "Argentina": "Argentina",
  "Algeria": "Argélia",
  "Austria": "Áustria",
  "Jordan": "Jordânia",
  "Portugal": "Portugal",
  "Congo DR": "Rep. Congo",
  "England": "Inglaterra",
  "Croatia": "Croácia",
  "Ghana": "Gana",
  "Panama": "Panamá",
  "Uzbekistan": "Uzbequistão",
  "Colombia": "Colômbia",
  "Morocco": "Marrocos",
  "Haiti": "Haiti",
  "Scotland": "Escócia",
  "Brazil": "Brasil",
}

function normalizeTeam(name: string): string {
  return TEAM_MAP[name] || name
}

function getDateStr(d: Date): string {
  return d.toISOString().slice(0, 10).replace(/-/g, "")
}

Deno.serve(async () => {
  try {
    const agora = new Date()
    const duasHorasAtras = new Date(agora.getTime() - 36 * 60 * 60 * 1000) // 36h — pega jogos que a função eventualmente perdeu

    // Buscar jogos no banco que deveriam ter terminado
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

    // Buscar resultados ESPN para os últimos 3 dias (garante cobertura mesmo se o cron falhar)
    const hoje = getDateStr(agora)
    const doisDiasAtras = getDateStr(new Date(agora.getTime() - 48 * 60 * 60 * 1000))
    const espnUrl = `https://site.web.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=${doisDiasAtras}-${hoje}`

    const espnRes = await fetch(espnUrl)
    if (!espnRes.ok) throw new Error(`Falha ESPN: ${espnRes.status}`)
    const espnData = await espnRes.json()
    const events = espnData.events || []

    // Indexar por par de times
    type EspnMatch = {
      homePt: string
      awayPt: string
      placarCasa: number
      placarFora: number
      finished: boolean
    }
    const matchIndex: EspnMatch[] = []

    for (const ev of events) {
      const comp = ev.competitions?.[0]
      if (!comp) continue
      const home = comp.competitors?.find((c: { homeAway: string }) => c.homeAway === "home")
      const away = comp.competitors?.find((c: { homeAway: string }) => c.homeAway === "away")
      if (!home || !away) continue
      const finished = comp.status?.type?.completed === true
      matchIndex.push({
        homePt: normalizeTeam(home.team.displayName),
        awayPt: normalizeTeam(away.team.displayName),
        placarCasa: parseInt(home.score) || 0,
        placarFora: parseInt(away.score) || 0,
        finished,
      })
    }

    let atualizados = 0
    let pontuados = 0

    for (const jogo of jogosParaVerificar) {
      const match = matchIndex.find(m =>
        (m.homePt === jogo.time_casa && m.awayPt === jogo.time_fora) ||
        (m.homePt === jogo.time_fora && m.awayPt === jogo.time_casa)
      )

      if (!match || !match.finished) continue

      // Ajusta placar conforme ordem no banco
      const invertido = match.homePt === jogo.time_fora
      const placarCasa = invertido ? match.placarFora : match.placarCasa
      const placarFora = invertido ? match.placarCasa : match.placarFora

      const { error: updateError } = await supabase
        .from("games")
        .update({ placar_casa: placarCasa, placar_fora: placarFora, status: "finished" })
        .eq("id", jogo.id)

      if (updateError) {
        console.error(`Erro ao atualizar jogo ${jogo.id}:`, updateError)
        continue
      }

      atualizados++

      const { error: rpcError } = await supabase.rpc("atualizar_scores_jogo", { p_game_id: jogo.id })
      if (rpcError) {
        console.error(`Erro ao calcular scores jogo ${jogo.id}:`, rpcError)
      } else {
        pontuados++
      }
    }

    return new Response(
      JSON.stringify({ message: "OK", verificados: jogosParaVerificar.length, atualizados, pontuados, ts: agora.toISOString() }),
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
