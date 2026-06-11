import { formatCurrency } from "@/lib/utils"

interface CaixaTransparenteProps {
  totalArrecadado: number
  totalParticipantes: number
  jogosDoDia11e12Gratis: boolean
}

export function CaixaTransparente({ totalArrecadado, totalParticipantes }: CaixaTransparenteProps) {
  const premio1lugar = totalArrecadado * 0.80
  const premio2lugar = totalArrecadado * 0.20

  return (
    <div className="rounded-xl border-2 border-[#1B3A8C] bg-blue-50 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-xl">🏆</span>
        <h2 className="font-bold text-[#1B3A8C] text-lg">Caixa do Bolão — 100% Transparente</h2>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="bg-white rounded-lg p-3 text-center border">
          <p className="text-xs text-muted-foreground">Participantes</p>
          <p className="text-2xl font-bold text-[#1B3A8C]">{totalParticipantes}</p>
        </div>
        <div className="bg-white rounded-lg p-3 text-center border">
          <p className="text-xs text-muted-foreground">Total arrecadado</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(totalArrecadado)}</p>
        </div>
        <div className="bg-white rounded-lg p-3 text-center border">
          <p className="text-xs text-muted-foreground">🥇 1º lugar (80%)</p>
          <p className="text-2xl font-bold text-yellow-600">{formatCurrency(premio1lugar)}</p>
        </div>
        <div className="bg-white rounded-lg p-3 text-center border">
          <p className="text-xs text-muted-foreground">🥈 2º lugar (20%)</p>
          <p className="text-2xl font-bold text-zinc-500">{formatCurrency(premio2lugar)}</p>
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Jogos de 11/06 e 12/06 são gratuitos. A partir de 13/06, cada participante contribui com uma taxa. 
        Todo valor vai 100% para os prêmios — sem lucro para a organização.
      </p>
    </div>
  )
}
