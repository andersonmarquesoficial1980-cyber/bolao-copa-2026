import Link from "next/link"
import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"

export async function Header() {
  const supabase = createSupabaseServerClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  let isAdmin = false

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single()

    isAdmin = Boolean(profile?.is_admin)
  }

  async function logoutAction() {
    "use server"
    const scopedSupabase = createSupabaseServerClient()
    await scopedSupabase.auth.signOut()
    redirect("/auth/login")
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-6">
        <Link href="/" className="text-lg font-extrabold tracking-tight text-primary">
          Bolão Copa 2026
        </Link>

        <nav className="hidden items-center gap-4 md:flex">
          <Link href="/ranking" className="text-sm font-medium hover:text-primary">
            Ranking
          </Link>
          {user && (
            <>
              <Link href="/dashboard" className="text-sm font-medium hover:text-primary">
                Dashboard
              </Link>
              <Link href="/rodada" className="text-sm font-medium hover:text-primary">
                Rodada
              </Link>
              {isAdmin && (
                <Link href="/admin" className="text-sm font-medium hover:text-primary">
                  Admin
                </Link>
              )}
            </>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {!user && (
            <>
              <Link href="/auth/login">
                <Button variant="outline" size="sm">
                  Entrar
                </Button>
              </Link>
              <Link href="/auth/cadastro">
                <Button size="sm">Cadastrar</Button>
              </Link>
            </>
          )}

          {user && (
            <form action={logoutAction}>
              <Button variant="outline" size="sm" type="submit">
                Sair
              </Button>
            </form>
          )}
        </div>
      </div>
    </header>
  )
}
