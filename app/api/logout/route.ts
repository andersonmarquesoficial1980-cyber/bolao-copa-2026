import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase"

export async function POST() {
  const supabase = createSupabaseServerClient()
  await supabase.auth.signOut()
  return NextResponse.redirect(new URL("/auth/login", process.env.NEXT_PUBLIC_APP_URL || "https://bolao-fremix-copa2026.vercel.app"))
}
