"use client"

interface Props {
  bandeiraCasa: string
  bandeiraFora: string
  placarCasa: number | undefined | null
  placarFora: number | undefined | null
}

function Flag({ url, alt }: { url: string; alt: string }) {
  if (!url || !url.startsWith("http")) return <span style={{ fontSize: "2rem" }}>{url}</span>
  return <img src={url} alt={alt} width={48} height={48} className="rounded-sm object-cover" style={{ width: 48, height: 48 }} />
}

export function PlacarBandeiras({ bandeiraCasa, bandeiraFora, placarCasa, placarFora }: Props) {
  return (
    <div className="flex items-center justify-center gap-4 my-2">
      <Flag url={bandeiraCasa} alt="casa" />
      <p className="text-3xl font-bold text-primary">{placarCasa ?? 0} – {placarFora ?? 0}</p>
      <Flag url={bandeiraFora} alt="fora" />
    </div>
  )
}
