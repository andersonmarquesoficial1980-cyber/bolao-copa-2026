import Link from "next/link"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase"

interface CadastroPageProps {
  searchParams?: { error?: string }
}

export default function CadastroPage({ searchParams }: CadastroPageProps) {
  async function signupAction(formData: FormData) {
    "use server"

    const nome = String(formData.get("nome") || "")
    const email = String(formData.get("email") || "")
    const password = String(formData.get("password") || "")

    const supabase = createSupabaseServerClient()

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nome }
      }
    })

    if (error) {
      redirect(`/auth/cadastro?error=${encodeURIComponent(error.message)}`)
    }

    if (data.user?.id) {
      const avatar_url = String(formData.get("avatar_url") || "")
    const admin = createSupabaseAdminClient()
      await admin.from("profiles").upsert(
        {
          id: data.user.id,
          nome,
          email,
          avatar_url: avatar_url || null,
          is_admin: false
        },
        { onConflict: "id" }
      )
    }

    redirect("/dashboard")
  }

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Criar conta</CardTitle>
          <CardDescription>Cadastre-se para participar do Bolão Copa 2026.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={signupAction} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="nome">Nome</Label>
              <Input id="nome" name="nome" required placeholder="Seu nome" />
            </div>

            <div className="space-y-1">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" name="email" type="email" required placeholder="voce@email.com" />
            </div>

            <div className="space-y-1">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" name="password" type="password" required minLength={6} />
            </div>

            <div className="space-y-1">
              <Label htmlFor="avatar_url">Link da foto de perfil <span className="text-muted-foreground">(opcional)</span></Label>
              <Input id="avatar_url" name="avatar_url" type="url" placeholder="https://sua-foto.com/foto.jpg" />
              <p className="text-xs text-muted-foreground">Cole o link de uma foto sua (Google Fotos, WhatsApp Web, etc)</p>
            </div>

            {searchParams?.error && (
              <p className="rounded-md border border-red-300 bg-red-50 p-2 text-sm text-red-700">{searchParams.error}</p>
            )}

            <Button type="submit" className="w-full">
              Cadastrar
            </Button>
          </form>

          <p className="mt-4 text-sm text-muted-foreground">
            Já possui conta?{" "}
            <Link href="/auth/login" className="font-medium text-primary hover:underline">
              Fazer login
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
