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
    <header className="sticky top-0 z-30 border-b border-border bg-white shadow-sm">
      <div className="fremix-stripe" />
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex flex-col leading-none">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#E03020]">Workfut · Fremix</span>
            <span className="text-lg font-black tracking-tight text-[#1B3A8C]">Bolão Copa 2026 ⚽</span>
          </div>
        </Link>

        <nav className="hidden items-center gap-4 md:flex">
          {user && (
            <>
              <Link href="/dashboard" className="text-sm font-medium hover:text-primary">
                Início
              </Link>
              <Link href="/rodada" className="text-sm font-medium hover:text-primary">
                Palpitar
              </Link>
              <Link href="/palpites" className="text-sm font-medium hover:text-primary">
                Palpites
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
