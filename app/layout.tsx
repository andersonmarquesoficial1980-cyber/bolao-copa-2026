import type { Metadata } from "next"
import "./globals.css"
import { Footer } from "@/components/Footer"
import { Header } from "@/components/Header"

export const metadata: Metadata = {
  title: "Bolão Copa 2026",
  description: "Bolão de palpites de placares da Copa 2026"
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <Header />
        <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
