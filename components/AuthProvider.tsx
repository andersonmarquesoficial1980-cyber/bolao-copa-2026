"use client"

import { useEffect } from "react"
import { createSupabaseBrowserClient } from "@/lib/supabase"
import { useRouter } from "next/navigation"

/**
 * Roda no client e escuta eventos de sessão do Supabase.
 * - SIGNED_OUT: redireciona para login
 * - TOKEN_REFRESHED: força reload da página para buscar dados frescos com novo token
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        router.push("/auth/login?error=Sessão expirada. Faça login novamente.")
      }
      if (event === "TOKEN_REFRESHED") {
        router.refresh() // rebusca dados server-side com token novo
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase, router])

  return <>{children}</>
}
