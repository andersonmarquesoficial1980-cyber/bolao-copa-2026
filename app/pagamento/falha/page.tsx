import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function PagamentoFalha() {
  return (
    <div className="mx-auto max-w-md mt-10">
      <Card>
        <CardContent className="py-10 text-center space-y-4">
          <p className="text-5xl">❌</p>
          <h1 className="text-2xl font-bold text-red-600">Pagamento não concluído</h1>
          <p className="text-muted-foreground">Tente novamente ou use outro método de pagamento.</p>
          <Link href="/dashboard"><Button className="w-full" variant="outline">Voltar</Button></Link>
        </CardContent>
      </Card>
    </div>
  )
}
