"use client"

import { flagUrl } from "@/lib/flagUrl"

interface Props {
  bandeiraCasa: string
  bandeiraFora: string
  timeCasa: string
  timoFora: string
  className?: string
  flagSize?: "16" | "20" | "32"
}

export function TituloJogo({ bandeiraCasa, bandeiraFora, timeCasa, timoFora, className = "", flagSize = "20" }: Props) {
  const urlCasa = flagUrl(bandeiraCasa, flagSize)
  const urlFora = flagUrl(bandeiraFora, flagSize)
  const px = Number(flagSize)

  return (
    <span className={`flex items-center gap-1.5 flex-wrap ${className}`}>
      {urlCasa ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={urlCasa} alt="" width={px} height={Math.round(px * 0.75)} className="rounded-sm shadow-sm inline-block object-contain" style={{ verticalAlign: "middle" }} />
      ) : (
        <span>{bandeiraCasa}</span>
      )}
      {timeCasa}
      <span className="text-muted-foreground">×</span>
      {timoFora}
      {urlFora ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={urlFora} alt="" width={px} height={Math.round(px * 0.75)} className="rounded-sm shadow-sm inline-block object-contain" style={{ verticalAlign: "middle" }} />
      ) : (
        <span>{bandeiraFora}</span>
      )}
    </span>
  )
}
