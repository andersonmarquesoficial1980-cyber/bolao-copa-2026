import type { Metadata } from "next"
import "./globals.css"
import { Footer } from "@/components/Footer"
import { Header } from "@/components/Header"
import { AuthProvider } from "@/components/AuthProvider"

export const metadata: Metadata = {
  title: "Fremix | Bolão Copa 2026",
  description: "Bolão de palpites da Copa do Mundo 2026 - Fremix"
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <AuthProvider>
          <Header />
          <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  )
}
