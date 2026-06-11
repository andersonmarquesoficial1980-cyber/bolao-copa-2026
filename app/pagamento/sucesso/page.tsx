import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function PagamentoSucesso() {
  return (
    <div className="mx-auto max-w-md mt-10">
      <Card>
        <CardContent className="py-10 text-center space-y-4">
          <p className="text-5xl">🎉</p>
          <h1 className="text-2xl font-bold text-green-600">Pagamento confirmado!</h1>
          <p className="text-muted-foreground">Sua inscrição no Workfut foi registrada. Boa sorte no bolão!</p>
          <Link href="/dashboard"><Button className="w-full">Ir para o início</Button></Link>
        </CardContent>
      </Card>
    </div>
  )
}
