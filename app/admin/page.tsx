import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createSupabaseServerClient } from "@/lib/supabase"

export default async function AdminPage() {
  const supabase = createSupabaseServerClient()

  const [{ count: gamesCount }, { count: usersCount }, { count: registrationsCount }, { count: predictionsCount }] =
    await Promise.all([
      supabase.from("games").select("id", { count: "exact", head: true }),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("registrations").select("id", { count: "exact", head: true }),
      supabase.from("predictions").select("id", { count: "exact", head: true })
    ])

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-3xl font-bold text-primary">Painel Administrativo</h1>
        <p className="text-muted-foreground">Gerencie jogos, resultados e inscrições do bolão.</p>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Jogos</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{gamesCount || 0}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Participantes</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{usersCount || 0}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Inscrições</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{registrationsCount || 0}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Palpites</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{predictionsCount || 0}</CardContent>
        </Card>
      </section>

      <section className="flex flex-wrap gap-3">
        <Link href="/admin/jogos">
          <Button>Gerenciar jogos</Button>
        </Link>
        <Link href="/admin/resultados">
          <Button variant="outline">Lançar resultados</Button>
        </Link>
        <Link href="/admin/inscritos">
          <Button variant="outline">Inscritos e pagamentos</Button>
        </Link>
        <Link href="/admin/relatorio-palpites">
          <Button variant="outline">🖨️ Relatório de palpites</Button>
        </Link>
      </section>
    </div>
  )
}
