"use client"

export function PrintButton() {
  return (
    <div className="print:hidden mb-4 flex justify-end">
      <button
        onClick={() => window.print()}
        className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary/90"
      >
        🖨️ Imprimir / Salvar PDF
      </button>
    </div>
  )
}
