"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase"

function toInt(value: FormDataEntryValue | null, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export async function submitPredictionAction(formData: FormData): Promise<{ ok: boolean; message: string }> {
  const supabase = createSupabaseServerClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) return { ok: false, message: "Faça login para palpitar" }

  const gameId = String(formData.get("game_id") || "")
  const palpiteCasa = toInt(formData.get("palpite_casa"), -1)
  const palpiteFora = toInt(formData.get("palpite_fora"), -1)

  if (!gameId || palpiteCasa < 0 || palpiteFora < 0) {
    return { ok: false, message: "Informe placares válidos" }
  }

  const { data: game } = await supabase
    .from("games")
    .select("id,status,data_jogo")
    .eq("id", gameId)
    .single()

  if (!game || game.status !== "scheduled") {
    return { ok: false, message: "Este jogo não aceita mais palpites" }
  }

  // A partir de 13/06, exige pagamento confirmado
  const dataJogo = new Date(game.data_jogo)
  const corte = new Date("2026-06-13T00:00:00-03:00")
  if (dataJogo >= corte) {
    const { data: reg } = await supabase
      .from("registrations")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "paid")
      .maybeSingle()
    if (!reg) {
      return { ok: false, message: "Faça sua inscrição de R$ 20,00 para palpitar nos jogos a partir de 13/06" }
    }
  }

  const { error } = await supabase.from("predictions").upsert(
    {
      user_id: user.id,
      game_id: gameId,
      palpite_casa: palpiteCasa,
      palpite_fora: palpiteFora,
      calculado: false,
      pontos: 0
    },
    { onConflict: "user_id,game_id" }
  )

  if (error) return { ok: false, message: error.message }

  revalidatePath("/rodada")
  revalidatePath("/dashboard")
  return { ok: true, message: "Palpite salvo com sucesso!" }
}

export async function registerPoolAction() {
  const supabase = createSupabaseServerClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login?error=Faça login para se inscrever")
  }

  const { error } = await supabase.from("registrations").upsert(
    {
      user_id: user.id,
      status: "pending"
    },
    { onConflict: "user_id" }
  )

  if (error) {
    redirect(`/dashboard?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath("/dashboard")
  revalidatePath("/")
  redirect("/dashboard?success=Inscrição registrada")
}
