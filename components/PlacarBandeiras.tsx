"use client"

import { flagUrl } from "@/lib/flagUrl"

interface Props {
  bandeiraCasa: string
  bandeiraFora: string
  placarCasa: number | undefined | null
  placarFora: number | undefined | null
}

export function PlacarBandeiras({ bandeiraCasa, bandeiraFora, placarCasa, placarFora }: Props) {
  const urlCasa = flagUrl(bandeiraCasa, "48")
  const urlFora = flagUrl(bandeiraFora, "48")

  return (
    <div className="flex items-center justify-center gap-4 my-2">
      {urlCasa ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={urlCasa} alt="" width={72} height={54} className="rounded-md shadow object-contain" />
      ) : (
        <span style={{ fontSize: "2.5rem", lineHeight: 1 }}>{bandeiraCasa}</span>
      )}
      <p className="text-3xl font-bold text-primary">{placarCasa ?? 0} – {placarFora ?? 0}</p>
      {urlFora ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={urlFora} alt="" width={72} height={54} className="rounded-md shadow object-contain" />
      ) : (
        <span style={{ fontSize: "2.5rem", lineHeight: 1 }}>{bandeiraFora}</span>
      )}
    </div>
  )
}
