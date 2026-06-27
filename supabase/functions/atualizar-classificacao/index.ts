/**
 * Edge Function: atualizar-classificacao
 * Roda via cron a cada 30 minutos.
 *
 * Estratégia: consulta ESPN pelo calendário da segunda fase (28/06–03/07)
 * e cruza por data+horário com os jogos do banco que ainda têm "A definir".
 * Quando encontra o par, atualiza time_casa e/ou time_fora.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const supabaseUrl = Deno.env.get("SUPABASE_URL")!
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const supabase = createClient(supabaseUrl, serviceKey)

const TEAM_MAP: Record<string, string> = {
  "Mexico": "México", "South Africa": "África do Sul", "Czechia": "República Tcheca",
  "South Korea": "Coreia do Sul", "Canada": "Canadá", "Bosnia-Herzegovina": "Bósnia",
  "Bosnia and Herzegovina": "Bósnia", "Switzerland": "Suíça", "Qatar": "Catar",
  "United States": "EUA", "Paraguay": "Paraguai", "Australia": "Austrália",
  "Türkiye": "Turquia", "Germany": "Alemanha", "Netherlands": "Holanda",
  "Japan": "Japão", "Ivory Coast": "Costa do Marfim", "Côte d'Ivoire": "Costa do Marfim",
  "Ecuador": "Equador", "Sweden": "Suécia", "Tunisia": "Tunísia", "Spain": "Espanha",
  "Cape Verde": "Cabo Verde", "Belgium": "Bélgica", "Egypt": "Egito",
  "Saudi Arabia": "Arábia Saudita", "Uruguay": "Uruguai", "Iran": "Irã",
  "New Zealand": "Nova Zelândia", "France": "França", "Senegal": "Senegal",
  "Iraq": "Iraque", "Norway": "Noruega", "Algeria": "Argélia", "Austria": "Áustria",
  "Jordan": "Jordânia", "Portugal": "Portugal", "Congo DR": "Rep. Congo",
  "England": "Inglaterra", "Croatia": "Croácia", "Ghana": "Gana", "Panama": "Panamá",
  "Uzbekistan": "Uzbequistão", "Colombia": "Colômbia", "Morocco": "Marrocos",
  "Haiti": "Haiti", "Scotland": "Escócia", "Brazil": "Brasil", "Curaçao": "Curaçao",
  "Argentina": "Argentina",
}

function norm(name: string): string {
  return TEAM_MAP[name] || name
}

// Arredonda timestamp para janela de 10 min (para tolerância de horário)
function slotKey(dateStr: string): string {
  const d = new Date(dateStr)
  d.setSeconds(0, 0)
  d.setMinutes(Math.round(d.getMinutes() / 10) * 10)
  return d.toISOString().slice(0, 16) // "2026-06-29T17:00"
}

Deno.serve(async () => {
  try {
    // 1. Buscar jogos da segunda fase com "A definir"
    const { data: jogos, error: jogosErr } = await supabase
      .from("games")
      .select("id, time_casa, time_fora, data_jogo, bandeira_casa, bandeira_fora")
      .eq("status", "scheduled")
      .or("time_casa.eq.A definir,time_fora.eq.A definir")
      // só da segunda fase (28/06 a 04/07)
      .gte("data_jogo", "2026-06-28T00:00:00Z")
      .lte("data_jogo", "2026-07-04T06:00:00Z")

    if (jogosErr) throw jogosErr
    if (!jogos || jogos.length === 0) {
      return ok({ message: "Nenhum jogo com 'A definir' encontrado", ts: new Date().toISOString() })
    }

    // 2. Buscar calendário ESPN da segunda fase
    const espnUrl = "https://site.web.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=20260628-20260704"
    const espnRes = await fetch(espnUrl, { headers: { "User-Agent": "Mozilla/5.0" } })
    if (!espnRes.ok) throw new Error(`ESPN scoreboard falhou: ${espnRes.status}`)
    const espnData = await espnRes.json()
    const events = espnData.events || []

    // Indexar ESPN por slot de horário
    type EspnGame = { homePt: string; awayPt: string; homeFlag: string; awayFlag: string }
    const espnBySlot = new Map<string, EspnGame>()

    for (const ev of events) {
      const comp = ev.competitions?.[0]
      if (!comp) continue
      const home = comp.competitors?.find((c: { homeAway: string }) => c.homeAway === "home")
      const away = comp.competitors?.find((c: { homeAway: string }) => c.homeAway === "away")
      if (!home || !away) continue

      // Só processar se AMBOS os times são reais (não placeholders)
      const homeName = home.team.displayName as string
      const awayName = away.team.displayName as string
      if (homeName.includes("Winner") || homeName.includes("Place") || homeName.includes("Group") ||
          awayName.includes("Winner") || awayName.includes("Place") || awayName.includes("Group")) {
        continue
      }

      const slot = slotKey(ev.date)
      const homeFlag = (home.team.logos?.[0]?.href as string) || ""
      const awayFlag = (away.team.logos?.[0]?.href as string) || ""

      espnBySlot.set(slot, {
        homePt: norm(homeName),
        awayPt: norm(awayName),
        homeFlag,
        awayFlag,
      })
    }

    let atualizados = 0

    for (const jogo of jogos) {
      const slot = slotKey(jogo.data_jogo)
      const espn = espnBySlot.get(slot)
      if (!espn) continue

      const updates: Record<string, string> = {}

      if (jogo.time_casa === "A definir") {
        updates.time_casa = espn.homePt
        if (espn.homeFlag) updates.bandeira_casa = espn.homeFlag
      }
      if (jogo.time_fora === "A definir") {
        updates.time_fora = espn.awayPt
        if (espn.awayFlag) updates.bandeira_fora = espn.awayFlag
      }

      if (Object.keys(updates).length === 0) continue

      const { error } = await supabase.from("games").update(updates).eq("id", jogo.id)
      if (error) {
        console.error(`Erro ao atualizar ${jogo.id}:`, error)
      } else {
        atualizados++
        console.log(`Atualizado: ${jogo.id} → ${updates.time_casa || jogo.time_casa} x ${updates.time_fora || jogo.time_fora}`)
      }
    }

    return ok({
      message: "OK",
      jogosComADefinir: jogos.length,
      espnGamesEncontrados: espnBySlot.size,
      atualizados,
      ts: new Date().toISOString(),
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
})

function ok(data: unknown) {
  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
  })
}
