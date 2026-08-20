"use client"

import { useState } from "react"
import { motion } from "motion/react"
import { Check, Loader2, Sparkles, TriangleAlert } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ImagePicker } from "@/components/image-picker"
import { useTracker } from "@/hooks/use-tracker"
import { fileToImagePart, resizeImage } from "@/lib/gemini"
import supabase from "@/lib/supabaseClient"
import { newId } from "@/lib/storage"
import type { FoodAnalysis, MealEntry } from "@/lib/types"

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
  const { addToday, mealHistory } = useTracker()

  // Foto (IA por imagen)
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [detalles, setDetalles] = useState<string>("")

  // Manual (IA por texto)
  const [description, setDescription] = useState<string>("")

  // Compartido entre ambos flujos
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<FoodAnalysis | null>(null)
  const [savedDetails, setSavedDetails] = useState<string | undefined>(undefined)

  function resetPhoto() {
    setFile(null)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
  }

  function resetAll() {
    resetPhoto()
    setDescription("")
    setResult(null)
    setError(null)
    setSavedDetails(undefined)
  }

  function handleSelect(f: File) {
    setResult(null)
    setError(null)
    setFile(f)
    setPreviewUrl(URL.createObjectURL(f))
  }

  /** Rellena la tarjeta de confirmación directamente desde el historial, sin llamar a Gemini. */
  function handleSelectHistory(meal: MealEntry) {
    setError(null)
    setResult({
      plato: meal.plato,
      calorias_totales: meal.calorias,
      proteinas_g: meal.proteinas_g,
      carbohidratos_g: meal.carbohidratos_g,
      grasas_g: meal.grasas_g,
      ingredientes: meal.ingredientes,
      confianza_estimacion: meal.confianza ?? "alta",
    })
    setSavedDetails(meal.detalles)
  }

  async function getAuthHeaders() {
    const { data: sessionData } = await supabase.auth.getSession()
    const session = sessionData.session
    if (!session) throw new Error("Inicia sesión para usar el análisis con IA")
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    }
  }

  async function handleAnalyzePhoto() {
    if (!file) return
    setLoading(true)
    setError(null)
    try {
      const headers = await getAuthHeaders()
      const { data: sessionData } = await supabase.auth.getSession()
      const session = sessionData.session!
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
      setSavedDetails(detalles || undefined)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al analizar la foto")
    } finally {
      setLoading(false)
    }
  }

  async function handleAnalyzeText() {
    if (!description.trim()) return
    setLoading(true)
    setError(null)
    try {
      const headers = await getAuthHeaders()
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers,
        body: JSON.stringify({ mode: "food_text", description: description.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Error al analizar la descripción")
      setResult(data as FoodAnalysis)
      setSavedDetails(description.trim())
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al analizar la descripción")
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
      detalles: savedDetails,
      confianza: result.confianza_estimacion,
      createdAt: Date.now(),
    })
    resetAll()
    onSaved()
  }

  return (
    <div className="flex flex-col gap-5 px-4 pb-4 pt-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Registrar comida</h1>
        <p className="text-sm text-muted-foreground">Fotografía tu plato o descríbelo y deja que la IA calcule las calorías</p>
      </header>

      <Tabs
        defaultValue="foto"
        className="gap-5"
        onValueChange={() => {
          setResult(null)
          setError(null)
        }}
      >
        <TabsList className="w-full">
          <TabsTrigger value="foto">Foto</TabsTrigger>
          <TabsTrigger value="manual">Manual</TabsTrigger>
        </TabsList>

        <TabsContent value="foto" className="flex flex-col gap-5">
          <ImagePicker
            previewUrl={previewUrl}
            onSelect={handleSelect}
            onClear={resetPhoto}
            accentColor="var(--food)"
          />

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Detalles (opcional)</Label>
            <Input
              value={detalles}
              onChange={(e) => setDetalles(e.target.value)}
              placeholder="añade aquí información adicional sobre tu plato"
              className="h-12"
            />
          </div>

          {file && !result && (
            <Button
              className="h-12 w-full gap-2 bg-food text-food-foreground hover:bg-food/90"
              onClick={handleAnalyzePhoto}
              disabled={loading}
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              {loading ? "Analizando plato..." : "Analizar Plato con IA"}
            </Button>
          )}
        </TabsContent>

        <TabsContent value="manual" className="flex flex-col gap-5">
          <Card className="gap-4 px-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Describe tu comida</Label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ej: comí arroz con pollo, 150g de pechuga y 100g de arroz blanco cocido"
                rows={4}
                className="w-full resize-none rounded-xl border border-input bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
              />
              <p className="text-xs text-muted-foreground">
                Cuanto más específico seas con las cantidades (gramos, unidades), más precisa será la estimación.
              </p>
            </div>

            {!result && (
              <Button
                className="h-12 w-full gap-2 bg-food text-food-foreground hover:bg-food/90 disabled:opacity-50"
                onClick={handleAnalyzeText}
                disabled={loading || !description.trim()}
              >
                {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                {loading ? "Analizando..." : "Analizar con IA"}
              </Button>
            )}
          </Card>

          {mealHistory.length > 0 && (
            <div className="flex flex-col gap-2">
              <Label className="text-xs text-muted-foreground">Tus platos recientes</Label>
              <div className="flex flex-wrap gap-2">
                {mealHistory.map((meal) => (
                  <button
                    key={meal.id}
                    type="button"
                    onClick={() => handleSelectHistory(meal)}
                    className="rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted/70"
                  >
                    {meal.plato} · {meal.calorias} kcal
                  </button>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

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