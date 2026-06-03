import Link from "next/link"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createSupabaseServerClient } from "@/lib/supabase"

interface LoginPageProps {
  searchParams?: { error?: string }
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  async function loginAction(formData: FormData) {
    "use server"

    const email = String(formData.get("email") || "")
    const password = String(formData.get("password") || "")

    const supabase = createSupabaseServerClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      redirect(`/auth/login?error=${encodeURIComponent(error.message)}`)
    }

    redirect("/dashboard")
  }

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Entrar no bolão</CardTitle>
          <CardDescription>Acesse sua conta para enviar seus palpites.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={loginAction} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" name="email" type="email" required placeholder="voce@email.com" />
            </div>

            <div className="space-y-1">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" name="password" type="password" required minLength={6} />
            </div>

            {searchParams?.error && (
              <p className="rounded-md border border-red-300 bg-red-50 p-2 text-sm text-red-700">{searchParams.error}</p>
            )}

            <Button type="submit" className="w-full">
              Entrar
            </Button>
          </form>

          <p className="mt-4 text-sm text-muted-foreground">
            Ainda não tem conta?{" "}
            <Link href="/auth/cadastro" className="font-medium text-primary hover:underline">
              Criar cadastro
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
