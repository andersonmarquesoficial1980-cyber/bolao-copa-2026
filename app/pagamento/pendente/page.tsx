import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function PagamentoPendente() {
  return (
    <div className="mx-auto max-w-md mt-10">
      <Card>
        <CardContent className="py-10 text-center space-y-4">
          <p className="text-5xl">⏳</p>
          <h1 className="text-2xl font-bold text-yellow-600">Pagamento pendente</h1>
          <p className="text-muted-foreground">Seu pagamento está sendo processado. Assim que confirmado, sua inscrição será registrada automaticamente.</p>
          <Link href="/dashboard"><Button className="w-full" variant="outline">Voltar ao início</Button></Link>
        </CardContent>
      </Card>
    </div>
  )
}
