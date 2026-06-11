"use client"

import { useState } from "react"
import Link from "next/link"

interface MobileMenuProps {
  isAdmin: boolean
  isLoggedIn: boolean
}

export function MobileMenu({ isAdmin, isLoggedIn }: MobileMenuProps) {
  const [open, setOpen] = useState(false)

  if (!isLoggedIn) return null

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex flex-col gap-1.5 p-2 rounded-lg hover:bg-gray-100"
        aria-label="Menu"
      >
        <span className={`block h-0.5 w-6 bg-[#1B3A8C] transition-all duration-200 ${open ? "rotate-45 translate-y-2" : ""}`} />
        <span className={`block h-0.5 w-6 bg-[#1B3A8C] transition-all duration-200 ${open ? "opacity-0" : ""}`} />
        <span className={`block h-0.5 w-6 bg-[#1B3A8C] transition-all duration-200 ${open ? "-rotate-45 -translate-y-2" : ""}`} />
      </button>

      {open && (
        <>
          {/* Overlay */}
          <div className="fixed inset-0 z-40 bg-black/20" onClick={() => setOpen(false)} />

          {/* Drawer */}
          <div className="fixed top-0 right-0 z-50 h-full w-72 bg-white shadow-xl flex flex-col">
            <div className="bg-[#1B3A8C] px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#E03020]">Workfut · Fremix</p>
              <p className="text-lg font-black text-white">Bolão Copa 2026 ⚽</p>
            </div>

            <nav className="flex-1 overflow-y-auto p-4 space-y-1 pb-20">
              {[
                { href: "/dashboard", label: "🏠 Início" },
                { href: "/rodada", label: "⚽ Palpitar" },
                { href: "/palpites", label: "👀 Palpites da Galera" },
                { href: "/regras", label: "📋 Regras" },
                { href: "/perfil", label: "👤 Meu Perfil" },
                { href: "/pagamento/pix", label: "💳 Pagar Inscrição" },
              ].map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center px-3 py-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-[#1B3A8C] transition-colors"
                >
                  {item.label}
                </Link>
              ))}

              {isAdmin && (
                <>
                  <div className="border-t my-2" />
                  <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Admin</p>
                  {[
                    { href: "/admin/pagamentos", label: "💰 Pagamentos" },
                    { href: "/admin", label: "⚙️ Painel Admin" },
                    { href: "/admin/resultados", label: "🏁 Resultados" },
                  ].map(item => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="flex items-center px-3 py-3 rounded-lg text-sm font-medium text-green-700 hover:bg-green-50 transition-colors"
                    >
                      {item.label}
                    </Link>
                  ))}
                </>
              )}
            </nav>

            {/* Footer com Sair */}
            <div className="border-t p-4">
              <form method="POST" action="/api/logout">
                <button
                  type="submit"
                  className="flex items-center justify-center gap-2 w-full py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
                >
                  🚪 Sair
                </button>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
