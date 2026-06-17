"use client"

import { useState } from "react"
import { flagUrl } from "@/lib/flagUrl"

interface Props {
  emoji: string
  alt?: string
  size?: "16" | "20" | "32" | "48" | "64"
  className?: string
}

/**
 * Renderiza bandeira como imagem (flagcdn.com) quando disponível,
 * com fallback automático para emoji de texto se a imagem falhar.
 */
export function FlagImg({ emoji, alt = "", size = "32", className = "" }: Props) {
  const [failed, setFailed] = useState(false)
  const url = flagUrl(emoji, size)

  if (!url || failed) return <span style={{ fontSize: size === "32" || size === "48" || size === "64" ? "1.5rem" : "1rem" }}>{emoji}</span>

  const px = Number(size)
  return (
    <img
      src={url}
      alt={alt || emoji}
      width={px}
      height={Math.round(px * 0.75)}
      className={`inline-block object-contain ${className}`}
      style={{ verticalAlign: "middle" }}
      onError={() => setFailed(true)}
    />
  )
}
