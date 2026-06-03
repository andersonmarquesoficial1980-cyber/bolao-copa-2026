export type GameStatus = "scheduled" | "live" | "finished" | "cancelled"
export type RegistrationStatus = "pending" | "paid" | "cancelled"
export type Fase = "grupo" | "oitavas" | "quartas" | "semifinal" | "terceiro_lugar" | "final"

export interface Profile {
  id: string
  nome: string
  email: string
  avatar_url?: string
  is_admin: boolean
  created_at: string
}

export interface Game {
  id: string
  group_id?: string
  time_casa: string
  time_fora: string
  bandeira_casa?: string
  bandeira_fora?: string
  data_jogo: string
  placar_casa?: number
  placar_fora?: number
  status: GameStatus
}

export interface Prediction {
  id: string
  user_id: string
  game_id: string
  palpite_casa: number
  palpite_fora: number
  pontos: number
  calculado: boolean
}

export interface Score {
  user_id: string
  total_pontos: number
  acertos_exatos: number
  acertos_resultado: number
  total_palpites: number
  profiles?: { nome: string; avatar_url?: string }
}

export interface Registration {
  id: string
  user_id: string
  status: RegistrationStatus
  valor_pago?: number
  paid_at?: string
}

export interface PrizeConfig {
  valor_inscricao: number
  percentual_1lugar: number
  percentual_2lugar: number
  percentual_3lugar: number
}
