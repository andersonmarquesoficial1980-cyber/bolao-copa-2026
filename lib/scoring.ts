export interface MatchResult {
  placarCasa: number
  placarFora: number
}

export interface Guess {
  palpiteCasa: number
  palpiteFora: number
}

export function getOutcome(casa: number, fora: number) {
  if (casa > fora) return "casa"
  if (fora > casa) return "fora"
  return "empate"
}

export function calculatePredictionPoints(guess: Guess, result: MatchResult) {
  const exact = guess.palpiteCasa === result.placarCasa && guess.palpiteFora === result.placarFora
  if (exact) return 10

  const sameOutcome =
    getOutcome(guess.palpiteCasa, guess.palpiteFora) === getOutcome(result.placarCasa, result.placarFora)

  if (!sameOutcome) return 0

  const goalDiffGuess = guess.palpiteCasa - guess.palpiteFora
  const goalDiffResult = result.placarCasa - result.placarFora
  const sameDiff = goalDiffGuess === goalDiffResult

  return sameDiff ? 7 : 5
}
