import { NextRequest, NextResponse } from "next/server"
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase"

export async function POST(req: NextRequest) {
  // Verifica se é admin
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single()
  if (!profile?.is_admin) return NextResponse.json({ error: "Não autorizado" }, { status: 403 })

  const { userId, acao } = await req.json()
  if (!userId) return NextResponse.json({ error: "userId obrigatório" }, { status: 400 })

  const admin = createSupabaseAdminClient()

  if (acao === "confirmar") {
    const { error } = await admin.from("registrations").upsert(
      { user_id: userId, status: "paid", valor_pago: 20, metodo_pagamento: "pix", paid_at: new Date().toISOString() },
      { onConflict: "user_id" }
    )
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  } else if (acao === "cancelar") {
    const { error } = await admin.from("registrations").delete().eq("user_id", userId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
