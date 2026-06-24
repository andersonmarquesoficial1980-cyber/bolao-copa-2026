"use client"

import { toggleBloqueioJogoAction } from "@/app/admin/actions"
import { Button } from "@/components/ui/button"
import { useState, useTransition } from "react"

interface BloqueioJogoToggleProps {
  gameId: string
  bloqueado: boolean
  bloqueadoAutomatico?: boolean
}

export function BloqueioJogoToggle({ gameId, bloqueado: inicial, bloqueadoAutomatico = false }: BloqueioJogoToggleProps) {
  const [bloqueado, setBloqueado] = useState(inicial)
  const efetivamenteBloqueado = bloqueado || bloqueadoAutomatico
  const [pending, startTransition] = useTransition()

  function handleToggle() {
    const novoEstado = !bloqueado
    setBloqueado(novoEstado)
    startTransition(async () => {
      const fd = new FormData()
      fd.append("game_id", gameId)
      fd.append("bloqueado", String(novoEstado))
      await toggleBloqueioJogoAction(fd)
    })
  }

  return (
    <Button
      variant={efetivamenteBloqueado ? "destructive" : "outline"}
      size="sm"
      onClick={handleToggle}
      disabled={pending || bloqueadoAutomatico}
      title={
        bloqueadoAutomatico
          ? "Bloqueado automaticamente — jogo já iniciou"
          : bloqueado
          ? "Liberar palpites deste jogo"
          : "Bloquear palpites deste jogo"
      }
    >
      {pending ? "..." : efetivamenteBloqueado ? (bloqueadoAutomatico ? "⏰" : "🔒") : "🔓"}
    </Button>
  )
}
