/**
 * Edge Function: atualizar-classificacao
 * Roda via cron após a fase de grupos (ou manualmente via invoke).
 * Consulta a classificação ESPN e preenche os times nas oitavas de final.
 *
 * Só atualiza um slot quando o grupo correspondente está 100% encerrado.
 * "Melhor 3º" não é resolvido aqui — depende de tabela de combinações FIFA.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const supabaseUrl = Deno.env.get("SUPABASE_URL")!
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const supabase = createClient(supabaseUrl, serviceKey)

// Mapeamento nomes ESPN (inglês) → banco (português) — espelho do atualizar-placares
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

function norm(name: string): string {
  return TEAM_MAP[name] || name
}

// Mapeamento: letra do banco → letra ESPN (oficial FIFA)
// Os grupos foram cadastrados no banco com letras diferentes das oficiais da ESPN/FIFA
const BANCO_TO_ESPN: Record<string, string> = {
  "A": "A", // Grupo A banco = Group A ESPN (México, Rep.Tcheca, Coreia do Sul, África do Sul)
  "B": "B", // Grupo B banco = Group B ESPN (Canadá, Bósnia, Suíça, Catar)
  "C": "D", // Grupo C banco = Group D ESPN (EUA, Paraguai, Austrália, Turquia)
  "D": "E", // Grupo D banco = Group E ESPN (Alemanha, Curaçao, Holanda, Japão) — aguardando confirmação
  "E": "F", // Grupo E banco = Group F ESPN (Equador, Suécia, Costa do Marfim, Tunísia) — aguardando
  "F": "G", // Grupo F banco = Group G ESPN (Espanha, Bélgica, Egito, Nova Zelândia)
  "G": "H", // Grupo G banco = Group H ESPN (Uruguai, Irã, Arábia Saudita, Cabo Verde)
  "H": "I", // Grupo H banco = Group I ESPN (França, Iraque, Noruega, Senegal)
  "I": "J", // Grupo I banco = Group J ESPN (Argentina, Áustria, Argélia, Jordânia)
  "J": "K", // Grupo J banco = Group K ESPN (Inglaterra, Croácia, Portugal, Rep. Congo) — aguardando
  "K": "L", // Grupo K banco = Group L ESPN (Colômbia, Gana, Panamá, Uzbequistão) — aguardando
  "L": "C", // Grupo L banco = Group C ESPN (Brasil, Escócia, Haiti, Marrocos)
}

type GroupStanding = {
  letter: string      // "A"..."L"
  first: string       // nome PT do 1º colocado
  second: string      // nome PT do 2º colocado
  third: string       // nome PT do 3º colocado
  firstFlag: string
  secondFlag: string
  thirdFlag: string
}

async function fetchStandings(): Promise<GroupStanding[]> {
  const url = "https://site.web.api.espn.com/apis/v2/sports/soccer/fifa.world/standings?season=2026"
  const res = await fetch(url)
  if (!res.ok) throw new Error(`ESPN standings falhou: ${res.status}`)
  const data = await res.json()

  const result: GroupStanding[] = []

  // A estrutura ESPN: data.standings[].name = "Group A", .entries[{team, stats}]
  const standings = data.standings || data.children || []

  for (const group of standings) {
    const name: string = group.name || group.abbreviation || ""
    const match = name.match(/Group ([A-L])/i)
    if (!match) continue
    const letter = match[1].toUpperCase()

    // entries ordenados por posição
    const entries = (group.entries || group.standings?.entries || []) as Array<{
      team: { displayName: string; logos?: Array<{ href: string }> }
      stats: Array<{ name: string; value: number }>
    }>

    if (entries.length < 3) continue

    const getFlag = (e: typeof entries[0]) => e.team.logos?.[0]?.href || ""

    result.push({
      letter,
      first: norm(entries[0].team.displayName),
      second: norm(entries[1].team.displayName),
      third: norm(entries[2].team.displayName),
      firstFlag: getFlag(entries[0]),
      secondFlag: getFlag(entries[1]),
      thirdFlag: getFlag(entries[2]),
    })
  }

  return result
}

Deno.serve(async () => {
  try {
    // 1. Buscar grupos da fase de grupos no banco
    const { data: grupos, error: gruposErr } = await supabase
      .from("groups")
      .select("id, nome, fase")
      .eq("fase", "grupo")

    if (gruposErr) throw gruposErr
    if (!grupos || grupos.length === 0) {
      return ok({ message: "Nenhum grupo encontrado" })
    }

    // 2. Para cada grupo, verificar se todos os jogos estão finalizados
    const gruposFinalizados = new Set<string>() // letras: "A", "B", ...

    for (const grupo of grupos) {
      const letraBanco = grupo.nome.replace("Grupo ", "").trim() // "Grupo A" → "A"
      const letraEspn = BANCO_TO_ESPN[letraBanco] || letraBanco // converter para letra ESPN

      const { data: jogos } = await supabase
        .from("games")
        .select("id, status")
        .eq("group_id", grupo.id)
        .neq("status", "cancelled")

      if (!jogos || jogos.length === 0) continue
      const todosFinalizado = jogos.every(j => j.status === "finished")
      if (todosFinalizado) gruposFinalizados.add(letraEspn) // guardar letra ESPN
    }

    if (gruposFinalizados.size === 0) {
      return ok({ message: "Nenhum grupo totalmente finalizado ainda", gruposFinalizados: [] })
    }

    // 3. Buscar classificação ESPN
    const standings = await fetchStandings()
    const standingMap = new Map(standings.map(s => [s.letter, s]))

    // 4. Buscar jogos das oitavas com placeholders
    const { data: oitavas, error: oitErr } = await supabase
      .from("games")
      .select("id, time_casa, time_fora, bandeira_casa, bandeira_fora")
      .eq("status", "scheduled")
      .or("time_casa.like.1º Grupo%,time_casa.like.2º Grupo%,time_fora.like.1º Grupo%,time_fora.like.2º Grupo%")

    if (oitErr) throw oitErr
    if (!oitavas || oitavas.length === 0) {
      return ok({ message: "Sem placeholders de oitavas para resolver", gruposFinalizados: [...gruposFinalizados] })
    }

    // 5. Resolver placeholders
    function resolveSlot(slot: string): { nome: string; flag: string } | null {
      // "1º Grupo A" → { nome: "Brasil", flag: "..." }
      // "2º Grupo B" → { nome: "Argentina", flag: "..." }
      const m1 = slot.match(/^1º Grupo ([A-L])$/)
      if (m1) {
        const letra = m1[1]
        if (!gruposFinalizados.has(letra)) return null
        const s = standingMap.get(letra)
        if (!s) return null
        return { nome: s.first, flag: s.firstFlag }
      }
      const m2 = slot.match(/^2º Grupo ([A-L])$/)
      if (m2) {
        const letra = m2[1]
        if (!gruposFinalizados.has(letra)) return null
        const s = standingMap.get(letra)
        if (!s) return null
        return { nome: s.second, flag: s.secondFlag }
      }
      // "Melhor 3º (...)" — não resolve aqui
      return null
    }

    let atualizados = 0

    for (const jogo of oitavas) {
      const updates: Record<string, string> = {}

      const casaResolved = resolveSlot(jogo.time_casa)
      if (casaResolved) {
        updates.time_casa = casaResolved.nome
        if (casaResolved.flag) updates.bandeira_casa = casaResolved.flag
      }

      const foraResolved = resolveSlot(jogo.time_fora)
      if (foraResolved) {
        updates.time_fora = foraResolved.nome
        if (foraResolved.flag) updates.bandeira_fora = foraResolved.flag
      }

      if (Object.keys(updates).length === 0) continue

      const { error: updErr } = await supabase
        .from("games")
        .update(updates)
        .eq("id", jogo.id)

      if (updErr) {
        console.error(`Erro ao atualizar jogo ${jogo.id}:`, updErr)
      } else {
        atualizados++
      }
    }

    return ok({
      message: "OK",
      gruposFinalizados: [...gruposFinalizados],
      standingsCarregados: standings.length,
      jogosDasOitavasVerificados: oitavas.length,
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
