import Link from "next/link"
import { registerPoolAction } from "@/app/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createSupabaseServerClient } from "@/lib/supabase"
import { formatCurrency } from "@/lib/utils"

interface DashboardPageProps {
  searchParams?: { error?: string; success?: string }
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const supabase = createSupabaseServerClient()

  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) return null

  const [{ data: profile }, { data: score }, { data: registration }, predResult, { data: config }] =
    await Promise.all([
      supabase.from("profiles").select("nome,email").eq("id", user.id).single(),
      supabase
        .from("scores")
        .select("total_pontos,acertos_exatos,acertos_resultado,total_palpites")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("registrations")
        .select("id,status,valor_pago")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("predictions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),
      supabase.from("prize_config").select("valor_inscricao").limit(1).maybeSingle()
    ])

  const totalPredictions = predResult.count ?? 0
  const valorInscricao = config?.valor_inscricao ?? 0

  return (
    <div className="space-y-6">
      <section className="space-y-1">
        <h1 className="text-3xl font-bold text-primary">Olá, {profile?.nome || "participante"}</h1>
        <p className="text-muted-foreground">Acompanhe sua evolução no bolão e atualize palpites da rodada.</p>
      </section>

      {searchParams?.error && (
        <p className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">{searchParams.error}</p>
      )}
      {searchParams?.success && (
        <p className="rounded-md border border-green-300 bg-green-50 p-3 text-sm text-green-700">{searchParams.success}</p>
      )}

      <section className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Pontos totais</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold text-primary">{score?.total_pontos || 0}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Acertos exatos</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{score?.acertos_exatos || 0}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Acertos resultado</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{score?.acertos_resultado || 0}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Palpites enviados</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{totalPredictions}</CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Inscrição no bolão</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              Status atual: <span className="font-semibold uppercase">{registration?.status || "não inscrito"}</span>
            </p>
            <p>Valor da inscrição: {formatCurrency(valorInscricao)}</p>

            {!registration && (
              <form action={registerPoolAction}>
                <Button type="submit">Solicitar inscrição</Button>
              </form>
            )}

            {registration?.status === "pending" && (
              <p className="rounded-md bg-muted p-2 text-muted-foreground">
                Sua inscrição está pendente de confirmação de pagamento.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ações rápidas</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Link href="/rodada">
              <Button>Palpitar rodada</Button>
            </Link>
            <Link href="/ranking">
              <Button variant="outline">Ver ranking</Button>
            </Link>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
