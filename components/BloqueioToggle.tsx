"use client"

import { toggleBloqueioAction } from "@/app/admin/actions"
import { Button } from "@/components/ui/button"
import { useState, useTransition } from "react"

interface BloqueioToggleProps {
  bloqueado: boolean
}

export function BloqueioToggle({ bloqueado: inicial }: BloqueioToggleProps) {
  const [bloqueado, setBloqueado] = useState(inicial)
  const [pending, startTransition] = useTransition()

  function handleToggle() {
    const novoEstado = !bloqueado
    setBloqueado(novoEstado)
    startTransition(async () => {
      const fd = new FormData()
      fd.append("bloqueado", String(novoEstado))
      await toggleBloqueioAction(fd)
    })
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border p-4 bg-card">
      <div className="flex-1">
        <p className="font-semibold text-sm">Bloqueio de palpites</p>
        <p className="text-xs text-muted-foreground">
          {bloqueado
            ? "🔒 Palpites bloqueados — ninguém pode palpitar agora"
            : "🟢 Palpites liberados — participantes podem palpitar normalmente"}
        </p>
      </div>
      <Button
        variant={bloqueado ? "destructive" : "outline"}
        size="sm"
        onClick={handleToggle}
        disabled={pending}
      >
        {pending ? "Salvando..." : bloqueado ? "🔓 Liberar" : "🔒 Bloquear"}
      </Button>
    </div>
  )
}
