"use client"

interface Props {
  bandeiraCasa: string
  bandeiraFora: string
  timeCasa: string
  timoFora: string
  className?: string
  flagSize?: "16" | "20" | "32"
}

function Flag({ url, alt }: { url: string; alt: string }) {
  if (!url || !url.startsWith("http")) return null
  return (
    <img
      src={url}
      alt={alt}
      width={20}
      height={20}
      className="inline-block rounded-sm object-cover"
      style={{ width: 20, height: 20 }}
    />
  )
}

export function TituloJogo({ bandeiraCasa, bandeiraFora, timeCasa, timoFora, className = "" }: Props) {
  return (
    <span className={`flex items-center gap-1.5 flex-wrap ${className}`}>
      <Flag url={bandeiraCasa} alt={timeCasa} />
      {timeCasa}
      <span className="text-muted-foreground">×</span>
      {timoFora}
      <Flag url={bandeiraFora} alt={timoFora} />
    </span>
  )
}
