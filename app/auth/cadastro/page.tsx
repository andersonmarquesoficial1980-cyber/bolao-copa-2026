"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { createSupabaseBrowserClient } from "@/lib/supabase-browser"

export default function CadastroPage() {
  const router = useRouter()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [nome, setNome] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const form = e.currentTarget
    const nomeVal = (form.elements.namedItem("nome") as HTMLInputElement).value
    const email = (form.elements.namedItem("email") as HTMLInputElement).value
    const password = (form.elements.namedItem("password") as HTMLInputElement).value
    const file = fileRef.current?.files?.[0]

    const supabase = createSupabaseBrowserClient()

    // 1. Cadastro
    const { data, error: signUpError } = await supabase.auth.signUp({ email, password, options: { data: { nome: nomeVal } } })
    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    const userId = data.user?.id
    if (!userId) {
      setError("Erro ao criar usuário.")
      setLoading(false)
      return
    }

    // 2. Upload da foto se houver
    let avatar_url: string | null = null
    if (file) {
      const ext = file.name.split(".").pop()
      const path = `${userId}.${ext}`
      const { error: uploadError } = await supabase.storage.from("avatares").upload(path, file, { upsert: true })
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from("avatares").getPublicUrl(path)
        avatar_url = urlData.publicUrl
      }
    }

    // 3. Upsert no profiles
    await supabase.from("profiles").upsert({ id: userId, nome: nomeVal, email, avatar_url, is_admin: false }, { onConflict: "id" })

    router.push("/dashboard")
  }

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Criar conta</CardTitle>
          <CardDescription>Cadastre-se para participar do Bolão Copa 2026.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="nome">Nome</Label>
              <Input id="nome" name="nome" required placeholder="Seu nome" value={nome} onChange={e => setNome(e.target.value)} />
            </div>

            <div className="space-y-1">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" name="email" type="email" required placeholder="voce@email.com" />
            </div>

            <div className="space-y-1">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" name="password" type="password" required minLength={6} />
            </div>

            {/* Upload de foto */}
            <div className="space-y-2">
              <Label>Foto de perfil <span className="text-muted-foreground">(opcional)</span></Label>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border-2 border-muted">
                  <AvatarImage src={preview || undefined} />
                  <AvatarFallback className="text-xl bg-blue-100 text-blue-700">
                    {nome ? nome.slice(0, 2).toUpperCase() : "⚽"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <input
                    ref={fileRef}
                    id="foto"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <Button type="button" variant="outline" className="w-full" onClick={() => fileRef.current?.click()}>
                    📷 Escolher foto
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">JPG, PNG ou WebP até 2MB</p>
                </div>
              </div>
            </div>

            {error && (
              <p className="rounded-md border border-red-300 bg-red-50 p-2 text-sm text-red-700">{error}</p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Criando conta..." : "Cadastrar"}
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
