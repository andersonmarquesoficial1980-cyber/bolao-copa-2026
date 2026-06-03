"use client"

import { useEffect, useMemo, useState } from "react"

interface CountdownTimerProps {
  targetDate: string
}

function getTimeLeft(targetDate: string) {
  const diff = new Date(targetDate).getTime() - Date.now()

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, ended: true }
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)
  const minutes = Math.floor((diff / (1000 * 60)) % 60)
  const seconds = Math.floor((diff / 1000) % 60)

  return { days, hours, minutes, seconds, ended: false }
}

export function CountdownTimer({ targetDate }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(targetDate))

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(getTimeLeft(targetDate))
    }, 1000)

    return () => clearInterval(timer)
  }, [targetDate])

  const label = useMemo(() => {
    if (timeLeft.ended) return "Partida iniciada"

    return `${timeLeft.days}d ${String(timeLeft.hours).padStart(2, "0")}h ${String(
      timeLeft.minutes
    ).padStart(2, "0")}m ${String(timeLeft.seconds).padStart(2, "0")}s`
  }, [timeLeft])

  return <span className="font-semibold text-primary">{label}</span>
}
