"use client"

import { useState } from "react"
import Link from "next/link"
import { createSupabaseBrowserClient } from "@/lib/supabase-browser"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState("")
  const [enviado, setEnviado] = useState(false)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErro("")

    const supabase = createSupabaseBrowserClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/nova-senha`,
    })

    if (error) {
      setErro(error.message)
    } else {
      setEnviado(true)
    }
    setLoading(false)
  }

  if (enviado) {
    return (
      <div className="mx-auto max-w-md mt-10 px-4">
        <Card>
          <CardContent className="py-10 text-center space-y-4">
            <p className="text-5xl">📧</p>
            <h1 className="text-xl font-bold text-primary">E-mail enviado!</h1>
            <p className="text-muted-foreground text-sm">
              Enviamos um link para <strong>{email}</strong>.<br/>
              Clique no link para criar uma nova senha.<br/>
              Verifique também a caixa de spam.
            </p>
            <Link href="/auth/login">
              <Button variant="outline" className="w-full">Voltar ao login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md mt-10 px-4">
      <Card>
        <CardHeader>
          <CardTitle>Esqueci minha senha</CardTitle>
          <CardDescription>Digite seu e-mail e enviaremos um link para criar uma nova senha.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                required
                placeholder="voce@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            {erro && (
              <p className="rounded-md border border-red-300 bg-red-50 p-2 text-sm text-red-700">{erro}</p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Enviando..." : "Enviar link de redefinição"}
            </Button>
          </form>

          <p className="mt-4 text-sm text-muted-foreground text-center">
            Lembrou a senha?{" "}
            <Link href="/auth/login" className="font-medium text-primary hover:underline">
              Fazer login
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
