"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { calculatePredictionPoints, getOutcome } from "@/lib/scoring"
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase"

async function requireAdmin() {
  const supabase = createSupabaseServerClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login?error=Faça login para continuar")
  }

  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single()

  if (!profile?.is_admin) {
    redirect("/dashboard?error=Acesso negado")
  }
}

function parseNumber(formData: FormData, key: string, fallback = 0) {
  const value = Number(formData.get(key))
  return Number.isFinite(value) ? value : fallback
}

async function refreshScores() {
  const admin = createSupabaseAdminClient()

  const { data: predictions, error } = await admin
    .from("predictions")
    .select("user_id,pontos,palpite_casa,palpite_fora,games(placar_casa,placar_fora,status)")

  if (error) return

  const grouped = new Map<
    string,
    { total_pontos: number; acertos_exatos: number; acertos_resultado: number; total_palpites: number }
  >()

  for (const prediction of predictions || []) {
    const game = Array.isArray(prediction.games) ? prediction.games[0] : prediction.games
    if (!game || game.status !== "finished") continue

    const current = grouped.get(prediction.user_id) || {
      total_pontos: 0,
      acertos_exatos: 0,
      acertos_resultado: 0,
      total_palpites: 0
    }

    current.total_pontos += prediction.pontos || 0
    current.total_palpites += 1

    const exact = prediction.palpite_casa === game.placar_casa && prediction.palpite_fora === game.placar_fora
    const outcomeEqual =
      getOutcome(prediction.palpite_casa, prediction.palpite_fora) ===
      getOutcome(game.placar_casa, game.placar_fora)

    if (exact) {
      current.acertos_exatos += 1
    } else if (outcomeEqual) {
      current.acertos_resultado += 1
    }

    grouped.set(prediction.user_id, current)
  }

  const rows = Array.from(grouped.entries()).map(([user_id, metrics]) => ({
    user_id,
    ...metrics
  }))

  if (rows.length > 0) {
    await admin.from("scores").upsert(rows, { onConflict: "user_id" })
  }
}

export async function createGameAction(formData: FormData) {
  await requireAdmin()
  const admin = createSupabaseAdminClient()

  const payload = {
    time_casa: String(formData.get("time_casa") || ""),
    time_fora: String(formData.get("time_fora") || ""),
    bandeira_casa: String(formData.get("bandeira_casa") || ""),
    bandeira_fora: String(formData.get("bandeira_fora") || ""),
    data_jogo: String(formData.get("data_jogo") || ""),
    group_id: String(formData.get("group_id") || ""),
    status: "scheduled"
  }

  if (!payload.time_casa || !payload.time_fora || !payload.data_jogo) {
    redirect("/admin/jogos?error=Preencha casa, fora e data")
  }

  const { error } = await admin.from("games").insert(payload)

  if (error) {
    redirect(`/admin/jogos?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath("/admin/jogos")
  revalidatePath("/rodada")
  redirect("/admin/jogos?success=Jogo criado")
}

export async function updateGameStatusAction(formData: FormData) {
  await requireAdmin()
  const admin = createSupabaseAdminClient()

  const gameId = String(formData.get("game_id") || "")
  const status = String(formData.get("status") || "scheduled")

  const { error } = await admin.from("games").update({ status }).eq("id", gameId)

  if (error) {
    redirect(`/admin/jogos?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath("/admin/jogos")
  revalidatePath("/rodada")
  redirect("/admin/jogos?success=Status atualizado")
}

export async function saveResultAction(formData: FormData) {
  await requireAdmin()
  const admin = createSupabaseAdminClient()

  const gameId = String(formData.get("game_id") || "")
  const placarCasa = parseNumber(formData, "placar_casa", 0)
  const placarFora = parseNumber(formData, "placar_fora", 0)

  const { error: gameError } = await admin
    .from("games")
    .update({ placar_casa: placarCasa, placar_fora: placarFora, status: "finished" })
    .eq("id", gameId)

  if (gameError) {
    redirect(`/admin/resultados?error=${encodeURIComponent(gameError.message)}`)
  }

  const { data: predictions } = await admin
    .from("predictions")
    .select("id,palpite_casa,palpite_fora")
    .eq("game_id", gameId)

  for (const prediction of predictions || []) {
    const pontos = calculatePredictionPoints(
      { palpiteCasa: prediction.palpite_casa, palpiteFora: prediction.palpite_fora },
      { placarCasa, placarFora }
    )

    await admin
      .from("predictions")
      .update({ pontos, calculado: true })
      .eq("id", prediction.id)
  }

  await refreshScores()

  revalidatePath("/admin/resultados")
  revalidatePath("/ranking")
  revalidatePath("/")
  revalidatePath("/dashboard")
  redirect("/admin/resultados?success=Resultado salvo e pontuação calculada")
}

export async function toggleBloqueioAction(formData: FormData) {
  await requireAdmin()
  const supabase = createSupabaseServerClient()

  const bloqueado = formData.get("bloqueado") === "true"

  await supabase
    .from("config")
    .upsert({ key: "palpites_bloqueados", value: String(bloqueado), updated_at: new Date().toISOString() })

  revalidatePath("/admin")
  revalidatePath("/rodada")
}

export async function updateRegistrationStatusAction(formData: FormData) {
  await requireAdmin()
  const admin = createSupabaseAdminClient()

  const id = String(formData.get("registration_id") || "")
  const status = String(formData.get("status") || "pending")
  const valorPago = parseNumber(formData, "valor_pago", 0)

  const updatePayload: Record<string, unknown> = { status }
  if (status === "paid") {
    updatePayload.valor_pago = valorPago
    updatePayload.paid_at = new Date().toISOString()
  }

  const { error } = await admin.from("registrations").update(updatePayload).eq("id", id)

  if (error) {
    redirect(`/admin/inscritos?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath("/admin/inscritos")
  revalidatePath("/dashboard")
  redirect("/admin/inscritos?success=Inscrição atualizada")
}
