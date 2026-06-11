import Link from "next/link"
import { Button } from "@/components/ui/button"

interface BotaoPagamentoProps {
  jaPagou: boolean
}

export function BotaoPagamento({ jaPagou }: BotaoPagamentoProps) {
  if (jaPagou) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
        ✅ Inscrição confirmada
      </span>
    )
  }

  return (
    <Link href="/pagamento/pix">
      <Button className="bg-[#32BCAD] hover:bg-[#27a090] text-white">
        📱 Pagar via PIX — R$ 20,00
      </Button>
    </Link>
  )
}
