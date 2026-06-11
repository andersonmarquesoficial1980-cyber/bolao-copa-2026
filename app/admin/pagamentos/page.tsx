import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"

async function confirmarPagamento(formData: FormData) {
  "use server"
  const userId = String(formData.get("user_id"))
  const admin = createSupabaseAdminClient()
  await admin.from("registrations").upsert(
    { user_id: userId, status: "paid", valor_pago: 20, metodo_pagamento: "pix", paid_at: new Date().toISOString() },
    { onConflict: "user_id" }
  )
  redirect("/admin/pagamentos")
}

async function cancelarPagamento(formData: FormData) {
  "use server"
  const userId = String(formData.get("user_id"))
  const admin = createSupabaseAdminClient()
  await admin.from("registrations").delete().eq("user_id", userId)
  redirect("/admin/pagamentos")
}

export default async function AdminPagamentosPage() {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single()
  if (!profile?.is_admin) redirect("/dashboard")

  const admin = createSupabaseAdminClient()

  // Busca todos os usuários + status de pagamento
  const { data: profiles } = await admin
    .from("profiles")
    .select("id,nome,email,avatar_url")
    .order("nome")

  const { data: registrations } = await admin
    .from("registrations")
    .select("user_id,status,valor_pago,paid_at")

  const regMap = new Map((registrations || []).map(r => [r.user_id, r]))
  const totalArrecadado = (registrations || [])
    .filter(r => r.status === "paid")
    .reduce((s, r) => s + (r.valor_pago || 0), 0)
  const totalPagos = (registrations || []).filter(r => r.status === "paid").length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary">💰 Pagamentos</h1>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">{totalPagos} pagos</p>
          <p className="text-xl font-bold text-green-600">{formatCurrency(totalArrecadado)}</p>
        </div>
      </div>

      <div className="grid gap-3">
        {(profiles || []).map(p => {
          const reg = regMap.get(p.id)
          const pago = reg?.status === "paid"

          return (
            <Card key={p.id} className={pago ? "border-green-300 bg-green-50" : ""}>
              <CardContent className="py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={p.avatar_url} />
                    <AvatarFallback className="text-xs">{p.nome?.slice(0,2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{p.nome}</p>
                    <p className="text-xs text-muted-foreground">{p.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {pago ? (
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-500 text-white">✅ Pago</Badge>
                      <form action={cancelarPagamento}>
                        <input type="hidden" name="user_id" value={p.id} />
                        <Button size="sm" variant="outline" className="text-red-500 text-xs h-7 border-red-200">Cancelar</Button>
                      </form>
                    </div>
                  ) : (
                    <form action={confirmarPagamento}>
                      <input type="hidden" name="user_id" value={p.id} />
                      <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">✓ Confirmar PIX</Button>
                    </form>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
