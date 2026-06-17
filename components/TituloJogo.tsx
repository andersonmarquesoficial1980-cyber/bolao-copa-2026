"use client"

interface Props {
  bandeiraCasa: string
  bandeiraFora: string
  timeCasa: string
  timoFora: string
  className?: string
  flagSize?: "16" | "20" | "32"
}

export function TituloJogo({ bandeiraCasa, bandeiraFora, timeCasa, timoFora, className = "" }: Props) {
  return (
    <span className={`flex items-center gap-1.5 flex-wrap ${className}`}>
      <span>{bandeiraCasa}</span>
      {timeCasa}
      <span className="text-muted-foreground">×</span>
      {timoFora}
      <span>{bandeiraFora}</span>
    </span>
  )
}
