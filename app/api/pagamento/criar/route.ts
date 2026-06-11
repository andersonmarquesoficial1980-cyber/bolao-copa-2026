import { NextRequest, NextResponse } from "next/server"
import { MercadoPagoConfig, Preference } from "mercadopago"
import { createSupabaseAdminClient } from "@/lib/supabase"

const mp = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
})

export async function POST(req: NextRequest) {
  try {
    const { userId, nomeParticipante, email } = await req.json()

    if (!userId) {
      return NextResponse.json({ error: "userId obrigatório" }, { status: 400 })
    }

    // Verifica se já pagou
    const admin = createSupabaseAdminClient()
    const { data: existing } = await admin
      .from("registrations")
      .select("id,status")
      .eq("user_id", userId)
      .eq("status", "paid")
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: "Participante já está inscrito" }, { status: 400 })
    }

    const preference = new Preference(mp)
    const result = await preference.create({
      body: {
        items: [
          {
            id: "workfut-inscricao",
            title: "Workfut · Bolão Copa 2026",
            quantity: 1,
            unit_price: 20.0,
            currency_id: "BRL",
          },
        ],
        payer: {
          name: nomeParticipante,
          email: email || undefined,
        },
        external_reference: userId,
        back_urls: {
          success: `${process.env.NEXT_PUBLIC_APP_URL}/pagamento/sucesso`,
          failure: `${process.env.NEXT_PUBLIC_APP_URL}/pagamento/falha`,
          pending: `${process.env.NEXT_PUBLIC_APP_URL}/pagamento/pendente`,
        },
        auto_return: "approved",
        notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/pagamento/webhook`,
      },
    })

    return NextResponse.json({ init_point: result.init_point })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
