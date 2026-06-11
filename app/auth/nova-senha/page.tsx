"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createSupabaseBrowserClient } from "@/lib/supabase-browser"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function NovaSenhaPage() {
  const router = useRouter()
  const [senha, setSenha] = useState("")
  const [confirmar, setConfirmar] = useState("")
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState("")
  const [pronto, setPronto] = useState(false)

  useEffect(() => {
    // Supabase injeta o token via hash na URL — o cliente processa automaticamente
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro("")

    if (senha.length < 6) {
      setErro("A senha deve ter pelo menos 6 caracteres")
      return
    }
    if (senha !== confirmar) {
      setErro("As senhas não coincidem")
      return
    }

    setLoading(true)
    const supabase = createSupabaseBrowserClient()
    const { error } = await supabase.auth.updateUser({ password: senha })

    if (error) {
      setErro(error.message)
    } else {
      setPronto(true)
      setTimeout(() => router.push("/dashboard"), 2000)
    }
    setLoading(false)
  }

  if (pronto) {
    return (
      <div className="mx-auto max-w-md mt-10 px-4">
        <Card>
          <CardContent className="py-10 text-center space-y-3">
            <p className="text-5xl">✅</p>
            <h1 className="text-xl font-bold text-green-600">Senha atualizada!</h1>
            <p className="text-muted-foreground text-sm">Redirecionando para o início...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md mt-10 px-4">
      <Card>
        <CardHeader>
          <CardTitle>Criar nova senha</CardTitle>
          <CardDescription>Digite sua nova senha para acessar o Workfut.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="senha">Nova senha</Label>
              <Input
                id="senha"
                type="password"
                required
                minLength={6}
                placeholder="Mínimo 6 caracteres"
                value={senha}
                onChange={e => setSenha(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="confirmar">Confirmar senha</Label>
              <Input
                id="confirmar"
                type="password"
                required
                placeholder="Repita a senha"
                value={confirmar}
                onChange={e => setConfirmar(e.target.value)}
              />
            </div>

            {erro && (
              <p className="rounded-md border border-red-300 bg-red-50 p-2 text-sm text-red-700">{erro}</p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Salvando..." : "Salvar nova senha"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
