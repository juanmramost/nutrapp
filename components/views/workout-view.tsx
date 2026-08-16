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
import type { WorkoutAnalysis } from "@/lib/types"

interface Props {
  onSaved: () => void
}

export function WorkoutView({ onSaved }: Props) {
  const { addToday } = useTracker()

  // Captura (IA)
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<WorkoutAnalysis | null>(null)

  // Manual
  const [tipo, setTipo] = useState("")
  const [kcal, setKcal] = useState("")

  function resetCapture() {
    setFile(null)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    setResult(null)
    setError(null)
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
      const resized = await resizeImage(file, 1024, 0.75)
      const part = await fileToImagePart(resized)
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ mode: "workout", image: part }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Error al analizar la captura")
      setResult(data as WorkoutAnalysis)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al analizar la captura")
    } finally {
      setLoading(false)
    }
  }

  function saveWorkout(tipo_actividad: string, calorias_activas: number) {
    addToday({
      id: newId(),
      type: "workout",
      tipo_actividad: tipo_actividad.trim() || "Entrenamiento",
      calorias_activas: Math.max(0, Math.round(calorias_activas)),
      createdAt: Date.now(),
    })
    resetCapture()
    setTipo("")
    setKcal("")
    onSaved()
  }

  const manualValid = tipo.trim().length > 0 && Number(kcal) > 0

  return (
    <div className="flex flex-col gap-5 px-4 pb-4 pt-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Registrar entreno</h1>
        <p className="text-sm text-muted-foreground">Sube una captura de tu reloj o introduce los datos a mano</p>
      </header>

      <Tabs defaultValue="captura" className="gap-5">
        <TabsList className="w-full">
          <TabsTrigger value="captura">Subir captura</TabsTrigger>
          <TabsTrigger value="manual">Manual</TabsTrigger>
        </TabsList>

        <TabsContent value="captura" className="flex flex-col gap-5">
          <ImagePicker
            previewUrl={previewUrl}
            onSelect={handleSelect}
            onClear={resetCapture}
            accentColor="var(--exercise)"
          />

          {file && !result && (
            <Button
              className="h-12 w-full gap-2 bg-exercise text-exercise-foreground hover:bg-exercise/90"
              onClick={handleAnalyze}
              disabled={loading}
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              {loading ? "Analizando captura..." : "Analizar con IA"}
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

          {result && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="gap-4 px-4">
                <h2 className="text-sm font-semibold">Confirma y ajusta</h2>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">Tipo de actividad</Label>
                  <Input
                    value={result.tipo_actividad}
                    onChange={(e) => setResult({ ...result, tipo_actividad: e.target.value })}
                    className="h-12"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">Calorías activas</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      inputMode="numeric"
                      value={result.calorias_activas}
                      onChange={(e) => setResult({ ...result, calorias_activas: Number(e.target.value) })}
                      className="h-12 pr-12 tabular-nums"
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      kcal
                    </span>
                  </div>
                </div>
                <Button
                  className="h-12 w-full gap-2 bg-exercise text-exercise-foreground hover:bg-exercise/90"
                  onClick={() => saveWorkout(result.tipo_actividad, result.calorias_activas)}
                >
                  <Check className="size-4" />
                  Guardar entreno
                </Button>
              </Card>
            </motion.div>
          )}
        </TabsContent>

        <TabsContent value="manual" className="flex flex-col gap-5">
          <Card className="gap-4 px-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Tipo de actividad</Label>
              <Input
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                placeholder="Correr, pesas, bici..."
                className="h-12"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Calorías activas quemadas</Label>
              <div className="relative">
                <Input
                  type="number"
                  inputMode="numeric"
                  value={kcal}
                  onChange={(e) => setKcal(e.target.value)}
                  placeholder="0"
                  className="h-12 pr-12 tabular-nums"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  kcal
                </span>
              </div>
            </div>
            <Button
              className="h-12 w-full gap-2 bg-exercise text-exercise-foreground hover:bg-exercise/90 disabled:opacity-50"
              disabled={!manualValid}
              onClick={() => saveWorkout(tipo, Number(kcal))}
            >
              <Check className="size-4" />
              Guardar entreno
            </Button>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
