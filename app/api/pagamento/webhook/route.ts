import { NextRequest, NextResponse } from "next/server"
import { MercadoPagoConfig, Payment } from "mercadopago"
import { createSupabaseAdminClient } from "@/lib/supabase"

const mp = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // MP envia topic=payment quando pagamento é aprovado
    if (body.type !== "payment") {
      return NextResponse.json({ ok: true })
    }

    const paymentId = String(body.data?.id)
    const payment = new Payment(mp)
    const data = await payment.get({ id: paymentId })

    if (data.status !== "approved") {
      return NextResponse.json({ ok: true })
    }

    const userId = data.external_reference
    if (!userId) {
      return NextResponse.json({ error: "Sem external_reference" }, { status: 400 })
    }

    const admin = createSupabaseAdminClient()

    // Registra pagamento
    await admin.from("registrations").upsert(
      {
        user_id: userId,
        status: "paid",
        valor_pago: data.transaction_amount,
        metodo_pagamento: data.payment_method_id,
        payment_id: paymentId,
        paid_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )

    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error("Webhook MP erro:", msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
