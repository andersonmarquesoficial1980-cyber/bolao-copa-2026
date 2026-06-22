"use client"

import { toggleBloqueioJogoAction } from "@/app/admin/actions"
import { Button } from "@/components/ui/button"
import { useState, useTransition } from "react"

interface BloqueioJogoToggleProps {
  gameId: string
  bloqueado: boolean
}

export function BloqueioJogoToggle({ gameId, bloqueado: inicial }: BloqueioJogoToggleProps) {
  const [bloqueado, setBloqueado] = useState(inicial)
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
      variant={bloqueado ? "destructive" : "outline"}
      size="sm"
      onClick={handleToggle}
      disabled={pending}
      title={bloqueado ? "Liberar palpites deste jogo" : "Bloquear palpites deste jogo"}
    >
      {pending ? "..." : bloqueado ? "🔒" : "🔓"}
    </Button>
  )
}
