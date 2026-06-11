"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createSupabaseBrowserClient } from "@/lib/supabase-browser"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function PagamentoPix() {
  const router = useRouter()
  const [copiado, setCopiado] = useState(false)
  const [jaPagou, setJaPagou] = useState(false)
  const [loading, setLoading] = useState(true)

  const chavePix = "29889830892"
  const valor = "R$ 20,00"
  const nomeRecebedor = "Anderson Marques"

  useEffect(() => {
    async function checar() {
      const supabase = createSupabaseBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/auth/login"); return }
      const { data } = await supabase
        .from("registrations")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "paid")
        .maybeSingle()
      setJaPagou(!!data)
      setLoading(false)
    }
    checar()
  }, [router])

  function copiar() {
    navigator.clipboard.writeText(chavePix)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  if (loading) return null

  if (jaPagou) {
    return (
      <div className="mx-auto max-w-md mt-10">
        <Card>
          <CardContent className="py-10 text-center space-y-4">
            <p className="text-5xl">✅</p>
            <h1 className="text-2xl font-bold text-green-600">Inscrição confirmada!</h1>
            <p className="text-muted-foreground">Você já está inscrito no Workfut. Boa sorte!</p>
            <Link href="/dashboard"><Button className="w-full">Ir para o início</Button></Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md mt-6 space-y-4 px-4">
      <Card className="border-2 border-[#1B3A8C]">
        <CardHeader className="bg-[#1B3A8C] text-white rounded-t-lg">
          <CardTitle className="text-center text-xl">💳 Pagar inscrição — Workfut</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 pt-5">

          {/* Valor */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Valor da inscrição</p>
            <p className="text-4xl font-black text-[#1B3A8C]">{valor}</p>
            <p className="text-xs text-muted-foreground mt-1">Copa do Mundo 2026 · Fase de grupos</p>
          </div>

          {/* Chave PIX */}
          <div className="rounded-xl border-2 border-dashed border-blue-300 bg-blue-50 p-4 space-y-3">
            <p className="text-sm font-semibold text-center text-[#1B3A8C]">🔑 Chave PIX (CPF)</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-lg bg-white border px-3 py-2 text-center text-lg font-mono tracking-widest select-all">
                {chavePix}
              </code>
              <Button size="sm" onClick={copiar} className="shrink-0">
                {copiado ? "✅ Copiado!" : "Copiar"}
              </Button>
            </div>
            <p className="text-xs text-center text-muted-foreground">Recebedor: <strong>{nomeRecebedor}</strong></p>
          </div>

          {/* Instruções */}
          <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3 space-y-1 text-sm">
            <p className="font-semibold text-yellow-800">📱 Como pagar:</p>
            <ol className="list-decimal list-inside space-y-1 text-yellow-700">
              <li>Abra o app do seu banco</li>
              <li>Vá em <strong>Pix → Transferir</strong></li>
              <li>Cole a chave CPF acima</li>
              <li>Informe o valor <strong>R$ 20,00</strong></li>
              <li>No campo descrição escreva seu <strong>nome</strong></li>
              <li>Confirme o pagamento</li>
            </ol>
          </div>

          {/* Comunicado comprovante */}
          <div className="rounded-lg bg-blue-50 border-2 border-[#1B3A8C] p-4 text-sm text-[#1B3A8C] space-y-2">
            <p className="font-bold text-base">📲 Após pagar, envie o comprovante!</p>
            <p>Mande o comprovante no WhatsApp para confirmar sua inscrição:</p>
            <a
              href="https://wa.me/5511997396211?text=Oi%20Anderson%2C%20segue%20meu%20comprovante%20do%20Workfut%20Bol%C3%A3o%20Copa%202026"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-lg bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 transition-colors"
            >
              <span className="text-xl">📱</span> Enviar comprovante — WhatsApp Anderson
            </a>
            <p className="text-xs text-center text-muted-foreground">Sua inscrição será confirmada em até 1 hora após o envio.</p>
          </div>

          <Link href="/dashboard">
            <Button variant="outline" className="w-full">Voltar ao início</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
