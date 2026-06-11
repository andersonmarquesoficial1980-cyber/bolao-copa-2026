import { NextResponse } from "next/server"

const TEAM_MAP: Record<string, string> = {
  "Mexico": "México", "South Africa": "África do Sul", "Czechia": "República Tcheca",
  "South Korea": "Coreia do Sul", "Canada": "Canadá", "Bosnia-Herzegovina": "Bósnia",
  "Switzerland": "Suíça", "Qatar": "Catar", "United States": "EUA",
  "Paraguay": "Paraguai", "Australia": "Austrália", "Türkiye": "Turquia",
  "Germany": "Alemanha", "Curaçao": "Curaçao", "Netherlands": "Holanda",
  "Japan": "Japão", "Ivory Coast": "Costa do Marfim", "Ecuador": "Equador",
  "Sweden": "Suécia", "Tunisia": "Tunísia", "Spain": "Espanha",
  "Cape Verde": "Cabo Verde", "Belgium": "Bélgica", "Egypt": "Egito",
  "Saudi Arabia": "Arábia Saudita", "Uruguay": "Uruguai", "Iran": "Irã",
  "New Zealand": "Nova Zelândia", "France": "França", "Senegal": "Senegal",
  "Iraq": "Iraque", "Norway": "Noruega", "Argentina": "Argentina",
  "Algeria": "Argélia", "Austria": "Áustria", "Jordan": "Jordânia",
  "Portugal": "Portugal", "Congo DR": "Rep. Congo", "England": "Inglaterra",
  "Croatia": "Croácia", "Ghana": "Gana", "Panama": "Panamá",
  "Uzbekistan": "Uzbequistão", "Colombia": "Colômbia", "Morocco": "Marrocos",
  "Haiti": "Haiti", "Scotland": "Escócia", "Brazil": "Brasil",
}

export async function GET() {
  try {
    const hoje = new Date().toISOString().slice(0, 10).replace(/-/g, "")
    const url = `https://site.web.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=${hoje}`
    const res = await fetch(url, { next: { revalidate: 0 } })
    const data = await res.json()

    const jogos = (data.events || []).map((e: Record<string, unknown>) => {
      const comp = (e.competitions as Record<string, unknown>[])[0]
      const competitors = comp.competitors as Record<string, unknown>[]
      const home = competitors.find((c: Record<string, unknown>) => c.homeAway === "home")!
      const away = competitors.find((c: Record<string, unknown>) => c.homeAway === "away")!
      const status = comp.status as Record<string, unknown>
      const statusType = status.type as Record<string, unknown>
      const clock = status.clock as number || 0

      return {
        home_en: (home.team as Record<string, unknown>).displayName as string,
        away_en: (away.team as Record<string, unknown>).displayName as string,
        home_pt: TEAM_MAP[(home.team as Record<string, unknown>).displayName as string] || (home.team as Record<string, unknown>).displayName,
        away_pt: TEAM_MAP[(away.team as Record<string, unknown>).displayName as string] || (away.team as Record<string, unknown>).displayName,
        placar_casa: parseInt(home.score as string) || 0,
        placar_fora: parseInt(away.score as string) || 0,
        state: statusType.state as string,       // pre | in | post
        descricao: statusType.description as string,
        minuto: Math.floor(clock / 60),
        completo: statusType.completed as boolean,
      }
    })

    return NextResponse.json({ jogos, ts: new Date().toISOString() })
  } catch {
    return NextResponse.json({ jogos: [], ts: new Date().toISOString() })
  }
}
