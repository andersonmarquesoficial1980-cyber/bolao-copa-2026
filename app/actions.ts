"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase"

function toInt(value: FormDataEntryValue | null, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export async function submitPredictionAction(formData: FormData) {
  const supabase = createSupabaseServerClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login?error=Faça login para palpitar")
  }

  const gameId = String(formData.get("game_id") || "")
  const palpiteCasa = toInt(formData.get("palpite_casa"), -1)
  const palpiteFora = toInt(formData.get("palpite_fora"), -1)

  if (!gameId || palpiteCasa < 0 || palpiteFora < 0) {
    redirect("/rodada?error=Informe placares válidos")
  }

  const { data: game } = await supabase
    .from("games")
    .select("id,status,data_jogo")
    .eq("id", gameId)
    .single()

  if (!game || game.status !== "scheduled" || new Date(game.data_jogo) <= new Date()) {
    redirect("/rodada?error=Este jogo não aceita mais palpites")
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

  if (error) {
    redirect(`/rodada?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath("/rodada")
  revalidatePath("/dashboard")
  redirect("/rodada?success=Palpite salvo com sucesso")
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
