"use client"

import { useState } from "react"
import { motion } from "motion/react"
import { Check, Loader2, Sparkles, TriangleAlert } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ImagePicker } from "@/components/image-picker"
import { useTracker } from "@/hooks/use-tracker"
import { fileToImagePart, resizeImage } from "@/lib/gemini"
import supabase from "@/lib/supabaseClient"
import { newId } from "@/lib/storage"
import type { FoodAnalysis } from "@/lib/types"

interface Props {
  onSaved: () => void
}

function NumberField({
  label,
  value,
  onChange,
  suffix,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  suffix: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="relative">
        <Input
          type="number"
          inputMode="numeric"
          value={Number.isFinite(value) ? value : 0}
          onChange={(e) => onChange(Number(e.target.value))}
          className="h-12 pr-10 tabular-nums"
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
          {suffix}
        </span>
      </div>
    </div>
  )
}

export function ScanFoodView({ onSaved }: Props) {
  const { addToday } = useTracker()
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<FoodAnalysis | null>(null)
  const [detalles, setDetalles] = useState<string>("")

  function reset() {
    setFile(null)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    setResult(null)
    setError(null)
    setDetalles("")
  }

  function handleSelect(f: File) {
    setResult(null)
    setError(null)
    setFile(f)
    setPreviewUrl(URL.createObjectURL(f))
  }

  async function handleAnalyze() {
    if (!file) return
    setLoading(true)
    setError(null)
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const session = sessionData.session
      if (!session) throw new Error("Inicia sesión para usar el análisis con IA")
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      }
      const resized = await resizeImage(file, 1024, 0.75)
      let res
      try {
        const path = `uploads/${session.user.id}/${Date.now()}.jpg`
        const { error: upErr } = await supabase.storage.from("uploads").upload(path, resized, { upsert: true })
        if (upErr) throw upErr
        res = await fetch("/api/analyze", {
          method: "POST",
          headers,
          body: JSON.stringify({ mode: "food", imagePath: path, details: detalles }),
        })
      } catch {
        const part = await fileToImagePart(resized)
        res = await fetch("/api/analyze", {
          method: "POST",
          headers,
          body: JSON.stringify({ mode: "food", image: part, details: detalles }),
        })
      }
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Error al analizar la foto")
      setResult(data as FoodAnalysis)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al analizar la foto")
    } finally {
      setLoading(false)
    }
  }

  function handleSave() {
    if (!result) return
    addToday({
      id: newId(),
      type: "meal",
      plato: result.plato,
      calorias: Math.round(result.calorias_totales),
      proteinas_g: Math.round(result.proteinas_g),
      carbohidratos_g: Math.round(result.carbohidratos_g),
      grasas_g: Math.round(result.grasas_g),
      ingredientes: result.ingredientes,
      detalles: detalles || undefined,
      confianza: result.confianza_estimacion,
      createdAt: Date.now(),
    })
    reset()
    onSaved()
  }

  return (
    <div className="flex flex-col gap-5 px-4 pb-4 pt-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Escanear comida</h1>
        <p className="text-sm text-muted-foreground">Fotografía tu plato y deja que la IA calcule las calorías</p>
      </header>

      <ImagePicker
        previewUrl={previewUrl}
        onSelect={handleSelect}
        onClear={reset}
        accentColor="var(--food)"
      />

      <div className="flex flex-col gap-1.5 mt-3">
        <Label className="text-xs text-muted-foreground">Detalles (opcional)</Label>
        <Input
          value={detalles}
          onChange={(e) => setDetalles(e.target.value)}
          placeholder="añade aqui informacion adicional sobre tu plato"
          className="h-12"
        />
      </div>

      {file && !result && (
        <Button
          className="h-12 w-full gap-2 bg-food text-food-foreground hover:bg-food/90"
          onClick={handleAnalyze}
          disabled={loading}
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          {loading ? "Analizando plato..." : "Analizar Plato con IA"}
        </Button>
      )}

      {error && (
        <Card className="gap-2 border-destructive/40 px-4 text-sm ring-destructive/40">
          <div className="flex items-center gap-2 font-medium text-destructive">
            <TriangleAlert className="size-4" />
            No se pudo analizar
          </div>
          <p className="text-muted-foreground">{error}</p>
        </Card>
      )}

      {loading && (
        <div className="flex flex-col gap-3">
          <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
          <div className="h-24 w-full animate-pulse rounded-xl bg-muted" />
        </div>
      )}

      {result && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="gap-4 px-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Confirma y ajusta</h2>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                Confianza: {result.confianza_estimacion}
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Plato</Label>
              <Input
                value={result.plato}
                onChange={(e) => setResult({ ...result, plato: e.target.value })}
                className="h-12"
              />
            </div>

            {/* detalles input shown above the picker */}

            <NumberField
              label="Calorías totales"
              value={result.calorias_totales}
              suffix="kcal"
              onChange={(v) => setResult({ ...result, calorias_totales: v })}
            />

            <div className="grid grid-cols-3 gap-3">
              <NumberField
                label="Proteínas"
                value={result.proteinas_g}
                suffix="g"
                onChange={(v) => setResult({ ...result, proteinas_g: v })}
              />
              <NumberField
                label="Carbos"
                value={result.carbohidratos_g}
                suffix="g"
                onChange={(v) => setResult({ ...result, carbohidratos_g: v })}
              />
              <NumberField
                label="Grasas"
                value={result.grasas_g}
                suffix="g"
                onChange={(v) => setResult({ ...result, grasas_g: v })}
              />
            </div>

            {result.ingredientes.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {result.ingredientes.map((ing, i) => (
                  <span key={i} className="rounded-full bg-muted px-2.5 py-1 text-xs">
                    {ing}
                  </span>
                ))}
              </div>
            )}

            <Button
              className="h-12 w-full gap-2 bg-food text-food-foreground hover:bg-food/90"
              onClick={handleSave}
            >
              <Check className="size-4" />
              Guardar en el día
            </Button>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
