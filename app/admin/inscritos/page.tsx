import { updateRegistrationStatusAction } from "@/app/admin/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { createSupabaseServerClient } from "@/lib/supabase"
import { formatCurrency } from "@/lib/utils"

interface AdminInscritosPageProps {
  searchParams?: { error?: string; success?: string }
}

export default async function AdminInscritosPage({ searchParams }: AdminInscritosPageProps) {
  const supabase = createSupabaseServerClient()

  const [{ data: registrations }, { data: prizeConfig }] = await Promise.all([
    supabase
      .from("registrations")
      .select("id,user_id,status,valor_pago,paid_at,profiles(nome,email)")
      .order("status", { ascending: true }),
    supabase.from("prize_config").select("valor_inscricao").limit(1).maybeSingle()
  ])

  const defaultAmount = prizeConfig?.valor_inscricao || 0

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-3xl font-bold text-primary">Inscritos e pagamentos</h1>
        <p className="text-muted-foreground">Valor padrão da inscrição: {formatCurrency(defaultAmount)}</p>
      </section>

      {searchParams?.error && (
        <p className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">{searchParams.error}</p>
      )}
      {searchParams?.success && (
        <p className="rounded-md border border-green-300 bg-green-50 p-3 text-sm text-green-700">{searchParams.success}</p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Lista de inscrições</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {registrations?.map((registration) => (
            <form
              key={registration.id}
              action={updateRegistrationStatusAction}
              className="grid gap-2 rounded-lg border border-border p-3 md:grid-cols-[1fr_auto_auto_auto] md:items-center"
            >
              <input type="hidden" name="registration_id" value={registration.id} />

              <div>
                <p className="font-semibold">{registration.profiles?.nome || registration.user_id}</p>
                <p className="text-sm text-muted-foreground">{registration.profiles?.email}</p>
              </div>

              <select
                name="status"
                defaultValue={registration.status}
                className="h-10 rounded-md border border-border bg-background px-3 text-sm"
              >
                <option value="pending">Pendente</option>
                <option value="paid">Pago</option>
                <option value="cancelled">Cancelado</option>
              </select>

              <Input
                name="valor_pago"
                type="number"
                step="0.01"
                min={0}
                defaultValue={registration.valor_pago ?? defaultAmount}
                className="w-28"
              />

              <Button type="submit" variant="outline">
                Atualizar
              </Button>
            </form>
          ))}

          {!registrations?.length && <p className="text-sm text-muted-foreground">Nenhuma inscrição encontrada.</p>}
        </CardContent>
      </Card>
    </div>
  )
}
