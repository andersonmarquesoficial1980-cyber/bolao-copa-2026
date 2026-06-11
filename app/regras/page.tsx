import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function RegrasPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-6">
      <h1 className="text-3xl font-bold text-primary">📋 Regras do Workfut</h1>
      <p className="text-muted-foreground">Bolão Copa do Mundo 2026 · Fremix</p>

      <Card>
        <CardHeader className="bg-[#1B3A8C] text-white rounded-t-lg pb-3">
          <CardTitle className="text-lg">⚽ Participação</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-2 text-sm">
          <p>✅ Válido para todos os jogos da <strong>fase de grupos</strong> (72 partidas)</p>
          <p>✅ Jogos de <strong>11/06 e 12/06</strong> são gratuitos — qualquer cadastrado pode palpitar</p>
          <p>✅ A partir de <strong>13/06</strong>, é necessário pagar a inscrição de <strong>R$ 20,00</strong> para continuar palpitando</p>
          <p>✅ Pagamento via <strong>PIX</strong> — CPF: 298.898.308-92 (Anderson Marques)</p>
          <p>✅ Após pagar, enviar comprovante no WhatsApp: <strong>(11) 99739-6211</strong></p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="bg-[#1B3A8C] text-white rounded-t-lg pb-3">
          <CardTitle className="text-lg">🎯 Palpites</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-2 text-sm">
          <p>✅ Cada participante palpita o placar de cada jogo (ex: Brasil 2 × 1 Argentina)</p>
          <p>✅ Os palpites podem ser <strong>editados livremente</strong> até <strong>1 hora antes</strong> do início da partida</p>
          <p>✅ Após esse horário, o palpite fica bloqueado e não pode mais ser alterado</p>
          <p>✅ Palpites de todos os participantes ficam visíveis para todo mundo</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="bg-[#1B3A8C] text-white rounded-t-lg pb-3">
          <CardTitle className="text-lg">🏅 Pontuação</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-3 text-sm">
          <div className="flex items-start gap-3 rounded-lg bg-green-50 border border-green-200 p-3">
            <span className="text-2xl">🎯</span>
            <div>
              <p className="font-bold text-green-700">Placar exato — 3 pontos</p>
              <p className="text-muted-foreground">Você palpitou o placar certinho.<br/>Ex: palpitou 2×1 e terminou 2×1.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-lg bg-blue-50 border border-blue-200 p-3">
            <span className="text-2xl">👍</span>
            <div>
              <p className="font-bold text-blue-700">Acertou o resultado — 1 ponto</p>
              <p className="text-muted-foreground">Acertou quem ganhou ou que seria empate, mas o placar foi diferente.<br/>Ex: palpitou 1×1 e terminou 3×3 → empate acertado = 1 ponto.<br/>Ex: palpitou 2×1 e terminou 3×1 → vitória do time da casa acertada = 1 ponto.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-lg bg-zinc-50 border border-zinc-200 p-3">
            <span className="text-2xl">❌</span>
            <div>
              <p className="font-bold text-zinc-600">Errou — 0 pontos</p>
              <p className="text-muted-foreground">Palpitou vitória e terminou derrota ou empate (ou vice-versa).</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="bg-[#1B3A8C] text-white rounded-t-lg pb-3">
          <CardTitle className="text-lg">🏆 Premiação</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-2 text-sm">
          <div className="flex items-center gap-3 rounded-lg bg-yellow-50 border border-yellow-300 p-3">
            <span className="text-3xl">🥇</span>
            <div>
              <p className="font-bold text-yellow-700">1º lugar — 80% do total arrecadado</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-zinc-50 border border-zinc-300 p-3">
            <span className="text-3xl">🥈</span>
            <div>
              <p className="font-bold text-zinc-600">2º lugar — 20% do total arrecadado</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground pt-1 text-center">
            💚 100% transparente — todo o valor arrecadado vai para os prêmios.<br/>
            Nenhum valor fica para a organização.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
