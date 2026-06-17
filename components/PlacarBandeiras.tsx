"use client"

interface Props {
  bandeiraCasa: string
  bandeiraFora: string
  placarCasa: number | undefined | null
  placarFora: number | undefined | null
}

export function PlacarBandeiras({ bandeiraCasa, bandeiraFora, placarCasa, placarFora }: Props) {
  return (
    <div className="flex items-center justify-center gap-4 my-2">
      <span style={{ fontSize: "3rem", lineHeight: 1 }}>{bandeiraCasa}</span>
      <p className="text-3xl font-bold text-primary">{placarCasa ?? 0} – {placarFora ?? 0}</p>
      <span style={{ fontSize: "3rem", lineHeight: 1 }}>{bandeiraFora}</span>
    </div>
  )
}
