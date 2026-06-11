import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase"
import { redirect } from "next/navigation"
import { formatCurrency } from "@/lib/utils"
import { PagamentosClient } from "./PagamentosClient"

export default async function AdminPagamentosPage() {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single()
  if (!profile?.is_admin) redirect("/dashboard")

  const admin = createSupabaseAdminClient()

  const { data: profiles } = await admin
    .from("profiles")
    .select("id,nome,email,avatar_url")
    .order("nome")

  const { data: registrations } = await admin
    .from("registrations")
    .select("user_id,status,valor_pago,paid_at")

  const totalArrecadado = (registrations || [])
    .filter(r => r.status === "paid")
    .reduce((s, r) => s + (r.valor_pago || 0), 0)
  const totalPagos = (registrations || []).filter(r => r.status === "paid").length

  const participantes = (profiles || []).map(p => ({
    id: p.id,
    nome: p.nome,
    email: p.email,
    avatar_url: p.avatar_url,
    pago: (registrations || []).some(r => r.user_id === p.id && r.status === "paid"),
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary">💰 Pagamentos</h1>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">{totalPagos} pagos de {participantes.length}</p>
          <p className="text-xl font-bold text-green-600">{formatCurrency(totalArrecadado)}</p>
        </div>
      </div>
      <PagamentosClient participantes={participantes} />
    </div>
  )
}
