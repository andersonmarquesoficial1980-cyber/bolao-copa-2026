"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { createSupabaseBrowserClient } from "@/lib/supabase-browser"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function PerfilPage() {
  const router = useRouter()
  const [nome, setNome] = useState("")
  const [preview, setPreview] = useState<string | null>(null)
  const [avatarAtual, setAvatarAtual] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [msg, setMsg] = useState("")
  const [userId, setUserId] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function carregar() {
      const supabase = createSupabaseBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/auth/login"); return }
      setUserId(user.id)
      const { data } = await supabase.from("profiles").select("nome,avatar_url").eq("id", user.id).single()
      if (data) {
        setNome(data.nome || "")
        setAvatarAtual(data.avatar_url || null)
      }
      setLoading(false)
    }
    carregar()
  }, [router])

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPreview(URL.createObjectURL(file))
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    setSalvando(true)
    setMsg("")
    const supabase = createSupabaseBrowserClient()

    let avatar_url = avatarAtual

    // Upload de foto se selecionou
    const file = fileRef.current?.files?.[0]
    if (file) {
      const ext = file.name.split(".").pop()
      const path = `${userId}.${ext}`
      const { error: uploadError } = await supabase.storage.from("avatares").upload(path, file, { upsert: true })
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from("avatares").getPublicUrl(path)
        avatar_url = urlData.publicUrl + `?t=${Date.now()}` // cache bust
      }
    }

    const { error } = await supabase.from("profiles").update({ nome, avatar_url }).eq("id", userId)
    if (error) {
      setMsg("Erro ao salvar: " + error.message)
    } else {
      setMsg("✅ Perfil atualizado!")
      setAvatarAtual(avatar_url)
      setPreview(null)
    }
    setSalvando(false)
  }

  if (loading) return null

  return (
    <div className="mx-auto max-w-md space-y-4 px-4 py-6">
      <h1 className="text-2xl font-bold text-primary">Meu Perfil</h1>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={salvar} className="space-y-5">

            {/* Avatar */}
            <div className="flex flex-col items-center gap-3">
              <Avatar className="h-24 w-24 border-4 border-[#1B3A8C] shadow-lg">
                <AvatarImage src={preview || avatarAtual || undefined} />
                <AvatarFallback className="text-2xl bg-blue-100 text-blue-700">
                  {nome ? nome.slice(0, 2).toUpperCase() : "⚽"}
                </AvatarFallback>
              </Avatar>

              <input ref={fileRef} type="file" accept="image/*" capture="user" className="hidden" onChange={handleFile} />

              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => {
                  if (fileRef.current) { fileRef.current.removeAttribute("capture"); fileRef.current.click() }
                }}>
                  📁 Galeria
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => {
                  if (fileRef.current) { fileRef.current.setAttribute("capture", "user"); fileRef.current.click() }
                }}>
                  📷 Câmera
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">JPG, PNG ou WebP até 2MB</p>
            </div>

            {/* Nome */}
            <div className="space-y-1">
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                value={nome}
                onChange={e => setNome(e.target.value)}
                required
                placeholder="Seu nome"
              />
            </div>

            {msg && (
              <p className={`text-sm text-center ${msg.startsWith("✅") ? "text-green-600" : "text-red-600"}`}>{msg}</p>
            )}

            <Button type="submit" className="w-full" disabled={salvando}>
              {salvando ? "Salvando..." : "Salvar perfil"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
