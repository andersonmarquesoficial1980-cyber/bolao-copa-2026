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
    <div className="flex items-center justify-center gap-3 my-1">
      {urlCasa
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={urlCasa} alt={bandeiraCasa} width={56} height={42} className="rounded shadow-sm object-contain" />
        : <span style={{ fontSize: "2rem" }}>{bandeiraCasa}</span>
      }
      <p className="text-2xl font-bold text-primary">{placarCasa ?? 0} – {placarFora ?? 0}</p>
      {urlFora
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={urlFora} alt={bandeiraFora} width={56} height={42} className="rounded shadow-sm object-contain" />
        : <span style={{ fontSize: "2rem" }}>{bandeiraFora}</span>
      }
    </div>
  )
}
