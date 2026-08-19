"use client"

import { useEffect, useRef, useState } from "react"
import { Sparkles } from "lucide-react"
import { Card } from "@/components/ui/card"
import { useTracker } from "@/hooks/use-tracker"
import { useAuth } from "@/hooks/use-auth"
import supabase from "@/lib/supabaseClient"

type Tone = "positivo" | "ajuste_leve" | "atencion"

interface RecommendationData {
  texto: string
  tono: Tone
  fecha: string
}

const TONE_STYLES: Record<Tone, { border: string; icon: string }> = {
  positivo: { border: "border-l-4 border-l-exercise", icon: "text-exercise" },
  ajuste_leve: { border: "border-l-4 border-l-deficit", icon: "text-deficit" },
  atencion: { border: "border-l-4 border-l-surplus", icon: "text-surplus" },
}

async function getAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? null
}

export function Recommendations() {
  const { todayEntries } = useTracker()
  const { user, isGuest } = useAuth()
  const [recommendation, setRecommendation] = useState<RecommendationData | null>(null)
  const [loading, setLoading] = useState(false)
  const requestedRef = useRef(false)

  const hasEntriesToday = todayEntries.length > 0
  const isAuthed = Boolean(user) && !isGuest

  // Carga de solo lectura: comprueba si ya existe recomendación hoy
  useEffect(() => {
    if (!isAuthed) return
    let cancelled = false

    async function loadExisting() {
      try {
        const token = await getAccessToken()
        if (!token) return
        const res = await fetch("/api/recommendations", {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) return
        const json = await res.json()
        if (!cancelled && json.recommendation) {
          setRecommendation(json.recommendation)
        }
      } catch {
        /* ignore */
      }
    }

    loadExisting()
    return () => {
      cancelled = true
    }
  }, [isAuthed])

  // Genera la recomendación automáticamente tras la primera entrada del día
  useEffect(() => {
    if (!isAuthed) return
    if (!hasEntriesToday) return
    if (recommendation) return
    if (requestedRef.current) return
    requestedRef.current = true

    let cancelled = false
    setLoading(true)

    async function generate() {
      try {
        const token = await getAccessToken()
        if (!token) return
        const res = await fetch("/api/recommendations", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) return
        const json = await res.json()
        if (!cancelled && json.recommendation) {
          setRecommendation(json.recommendation)
        }
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    generate()
    return () => {
      cancelled = true
    }
  }, [isAuthed, hasEntriesToday, recommendation])

  if (!isAuthed) return null

  const toneStyle = recommendation ? TONE_STYLES[recommendation.tono] : null

  return (
    <Card className={`gap-2 p-4 ${toneStyle?.border ?? ""}`}>
      <div className="flex items-center gap-2">
        <Sparkles className={`size-4 ${toneStyle?.icon ?? "text-muted-foreground"}`} />
        <h2 className="text-sm font-semibold">Recomendaciones</h2>
      </div>

      {!hasEntriesToday && (
        <p className="text-sm text-muted-foreground">
          Registra tu primera comida o entrenamiento para ver tu recomendación de hoy.
        </p>
      )}

      {hasEntriesToday && loading && !recommendation && (
        <p className="text-sm text-muted-foreground">Preparando tu recomendación personalizada…</p>
      )}

      {recommendation && <p className="text-sm leading-relaxed">{recommendation.texto}</p>}
    </Card>
  )
}