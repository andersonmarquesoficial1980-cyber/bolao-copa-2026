import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  // Cria response mutável para poder propagar cookies renovados
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          // CRÍTICO: setar tanto no request quanto no response
          // para que o refresh_token renovado chegue ao browser
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options as Record<string, unknown>)
          )
        }
      }
    }
  )

  // getUser() renova o access_token automaticamente se expirado
  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const isProtected =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/rodada") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/palpites")

  if (isProtected && !user) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    url.searchParams.set("error", "Faça login para continuar")
    return NextResponse.redirect(url)
  }

  if (pathname.startsWith("/admin") && user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single()

    if (!profile?.is_admin) {
      const url = request.nextUrl.clone()
      url.pathname = "/dashboard"
      url.searchParams.set("error", "Acesso restrito para administradores")
      return NextResponse.redirect(url)
    }
  }

  // Retorna response com cookies atualizados (refresh_token renovado)
  return response
}

export const config = {
  matcher: [
    /*
     * Aplica em todas as rotas exceto:
     * - _next/static, _next/image, favicon, arquivos de imagem
     * - api/pagamento/webhook (precisa ser sem auth)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"
  ]
}
