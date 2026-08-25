"use client"

import { useMemo, useState } from "react"
import { Clock, Loader2, Sparkles, TriangleAlert } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { DishImage } from "@/components/dish-image"
import { MacroGrid } from "@/components/macro-grid"
import { useAuth } from "@/hooks/use-auth"
import { useTracker } from "@/hooks/use-tracker"
import supabase from "@/lib/supabaseClient"
import { getGenericImage } from "@/lib/dish-images"
import { getRemainingMacros } from "@/lib/macroFit"
import { createDish } from "@/lib/dishes"
import type { WhatToCookRecipe } from "@/lib/geminiWhatToCook"

interface Props {
  onBack: () => void
}

export function QueCocinarView({ onBack }: Props) {
  const { user } = useAuth()
  const { profile, totals } = useTracker()
  const [ingredients, setIngredients] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recipes, setRecipes] = useState<WhatToCookRecipe[]>([])
  const [savingId, setSavingId] = useState<string | null>(null)
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())

  const remaining = useMemo(() => getRemainingMacros(profile, totals), [profile, totals])

  async function handleGenerate() {
    if (!ingredients.trim()) return
    setLoading(true)
    setError(null)
    setRecipes([])
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const session = sessionData.session
      if (!session) throw new Error("Inicia sesión para usar esta función")

      const res = await fetch("/api/what-to-cook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          ingredients: ingredients.trim(),
          remaining,
          objetivo: profile.objetivo,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Error al generar recetas")
      setRecipes(data.recipes as WhatToCookRecipe[])
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al generar recetas")
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(recipe: WhatToCookRecipe) {
    if (!user) return
    setSavingId(recipe.id)
    const saved = await createDish(user.id, {
      nombre: recipe.nombre,
      ingredientes: recipe.ingredientes.map((i) => ({ nombre: i.nombre, cantidad: i.cantidad, unidad: i.unidad })),
      calorias: recipe.calorias,
      proteinas_g: recipe.proteinas_g,
      carbohidratos_g: recipe.carbohidratos_g,
      grasas_g: recipe.grasas_g,
      instrucciones: recipe.instrucciones,
      origen: "que_cocinar",
    })
    if (saved) setSavedIds((prev) => new Set(prev).add(recipe.id))
    setSavingId(null)
  }

  function fitLabel(recipe: WhatToCookRecipe): string {
    const kcalRatio = remaining.kcal > 0 ? recipe.calorias / remaining.kcal : 2
    const proteinRatio = remaining.proteinas_g > 0 ? recipe.proteinas_g / remaining.proteinas_g : 1
    if (kcalRatio <= 1.15 && proteinRatio >= 0.5) return "✓ Excelente opción para tus macros"
    if (proteinRatio >= 0.7) return "✓ Alta en proteína"
    if (kcalRatio <= 1.4) return "✓ Buena opción para tus macros"
    return "○ Buena opción, aunque algo por encima de tus kcal restantes"
  }

  return (
    <div className="flex flex-col gap-5 px-4 pb-4 pt-8">
      <button type="button" onClick={onBack} className="self-start text-sm font-medium text-muted-foreground">
        ← Volver a Cocina
      </button>

      <header>
        <h1 className="text-2xl font-bold tracking-tight">¿Qué puedo cocinar?</h1>
        <p className="text-sm text-muted-foreground">Dinos qué tienes en la nevera y te proponemos 3 recetas</p>
      </header>

      <Card className="gap-3 px-4">
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">Ingredientes disponibles</Label>
          <textarea
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
            placeholder="Ej: tengo pollo, arroz, huevos, aguacate y tomate"
            rows={3}
            className="w-full resize-none rounded-xl border border-input bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
          />
          <p className="text-xs text-muted-foreground">No hace falta que pongas cantidades exactas.</p>
        </div>
        <Button
          className="h-12 w-full gap-2 disabled:opacity-50"
          onClick={handleGenerate}
          disabled={loading || !ingredients.trim()}
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          {loading ? "Pensando recetas..." : "Generar recetas"}
        </Button>
      </Card>

      {error && (
        <Card className="gap-2 border-destructive/40 px-4 text-sm ring-destructive/40">
          <div className="flex items-center gap-2 font-medium text-destructive">
            <TriangleAlert className="size-4" />
            {error}
          </div>
        </Card>
      )}

      {loading && (
        <div className="flex flex-col gap-3">
          <div className="h-40 w-full animate-pulse rounded-xl bg-muted" />
          <div className="h-40 w-full animate-pulse rounded-xl bg-muted" />
          <div className="h-40 w-full animate-pulse rounded-xl bg-muted" />
        </div>
      )}

      {recipes.length > 0 && (
        <div className="flex flex-col gap-4">
          {recipes.map((recipe, i) => {
            const propios = recipe.ingredientes.filter((ing) => !ing.adicional)
            const adicionales = recipe.ingredientes.filter((ing) => ing.adicional)
            const alreadySaved = savedIds.has(recipe.id)

            return (
              <Card key={recipe.id} className="gap-3 px-4">
                <DishImage
                  src={getGenericImage(recipe, i)}
                  alt={recipe.nombre}
                  className="h-36 w-full rounded-xl object-cover"
                />

                <div>
                  <h2 className="text-base font-bold">{recipe.nombre}</h2>
                  <p className="text-xs font-medium text-muted-foreground">{fitLabel(recipe)}</p>
                </div>

                <MacroGrid
                  kcal={recipe.calorias}
                  proteinas={recipe.proteinas_g}
                  carbohidratos={recipe.carbohidratos_g}
                  grasas={recipe.grasas_g}
                />

                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="size-3.5" />
                  {recipe.tiempo_preparacion_min} min
                </p>

                <div className="flex flex-col gap-1">
                  <p className="text-xs font-semibold">Ingredientes que tienes</p>
                  <div className="flex flex-wrap gap-1.5">
                    {propios.map((ing, idx) => (
                      <span key={idx} className="rounded-full bg-muted px-2.5 py-1 text-xs">
                        {ing.cantidad}{ing.unidad} {ing.nombre}
                      </span>
                    ))}
                  </div>
                </div>

                {adicionales.length > 0 && (
                  <div className="flex flex-col gap-1">
                    <p className="text-xs font-semibold">Ingredientes adicionales recomendados</p>
                    <div className="flex flex-wrap gap-1.5">
                      {adicionales.map((ing, idx) => (
                        <span
                          key={idx}
                          className="rounded-full bg-deficit/15 px-2.5 py-1 text-xs text-deficit"
                        >
                          {ing.cantidad}{ing.unidad} {ing.nombre}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-1">
                  <p className="text-xs font-semibold">Preparación</p>
                  <p className="whitespace-pre-line text-xs text-muted-foreground">{recipe.instrucciones}</p>
                </div>

                <Button
                  variant="outline"
                  className="h-11 w-full gap-2 disabled:opacity-50"
                  onClick={() => handleSave(recipe)}
                  disabled={savingId === recipe.id || alreadySaved}
                >
                  {savingId === recipe.id ? <Loader2 className="size-4 animate-spin" /> : null}
                  {alreadySaved ? "Guardado en Mis platos" : "Guardar en Mis platos"}
                </Button>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}