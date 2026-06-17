"use client"

import { flagUrl } from "@/lib/flagUrl"

interface Props {
  emoji: string
  alt?: string
  size?: "16" | "20" | "32" | "48" | "64"
  className?: string
}

/**
 * Renderiza bandeira como imagem (flagcdn.com) quando disponível,
 * com fallback para emoji de texto se não tiver mapeamento.
 */
export function FlagImg({ emoji, alt = "", size = "32", className = "" }: Props) {
  const url = flagUrl(emoji, size)
  if (!url) return <span>{emoji}</span>

  const px = Number(size)
  return (
    <img
      src={url}
      alt={alt || emoji}
      width={px}
      height={Math.round(px * 0.75)}
      className={`inline-block object-contain ${className}`}
      style={{ verticalAlign: "middle" }}
    />
  )
}
