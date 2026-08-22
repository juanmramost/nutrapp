"use client"

import { useEffect, useMemo, useState } from "react"
import { Clock, Flame, Loader2, RefreshCw, TriangleAlert } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { useTracker } from "@/hooks/use-tracker"
import supabase from "@/lib/supabaseClient"
import { getGenericImage } from "@/lib/dish-images"
import { getRemainingMacros, computeMacroFit } from "@/lib/macroFit"
import { createDish } from "@/lib/dishes"
import type { CookingCategory, CookingRecipe } from "@/lib/types"

interface Props {
  onBack: () => void
}

const CATEGORIES: { id: CookingCategory; label: string }[] = [
  { id: "desayuno", label: "Desayuno" },
  { id: "almuerzo", label: "Almuerzo" },
  { id: "postre", label: "Postre" },
  { id: "cena", label: "Cena" },
]

async function authedFetch(path: string, method: "GET" | "POST") {
  const { data: sessionData } = await supabase.auth.getSession()
  const session = sessionData.session
  if (!session) throw new Error("Inicia sesión para ver las recomendaciones")
  return fetch(path, {
    method,
    headers: { Authorization: `Bearer ${session.access_token}` },
  })
}

export function RecomendadosView({ onBack }: Props) {
  const { user } = useAuth()
  const { profile, totals } = useTracker()
  const [recipes, setRecipes] = useState<CookingRecipe[]>([])
  const [category, setCategory] = useState<CookingCategory>("desayuno")
  const [loading, setLoading] = useState(true)
  const [regenerating, setRegenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [detail, setDetail] = useState<CookingRecipe | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())

  const remaining = useMemo(() => getRemainingMacros(profile, totals), [profile, totals])

  useEffect(() => {
    async function load() {
      if (!user) return
      setLoading(true)
      setError(null)
      try {
        const res = await authedFetch("/api/cooking-recommendations", "GET")
        const data = await res.json()
        if (!res.ok) throw new Error(data?.error || "Error al cargar recomendaciones")

        if (!data.recommendations || data.recommendations.expired || data.recommendations.recipes.length === 0) {
          // No hay ciclo vigente: generamos uno nuevo (solo la primera vez o al caducar)
          const genRes = await authedFetch("/api/cooking-recommendations", "POST")
          const genData = await genRes.json()
          if (!genRes.ok) throw new Error(genData?.error || "Error al generar recomendaciones")
          setRecipes(genData.recommendations.recipes)
        } else {
          setRecipes(data.recommendations.recipes)
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error al cargar recomendaciones")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  async function handleRegenerate() {
    setRegenerating(true)
    setError(null)
    try {
      const res = await authedFetch("/api/cooking-recommendations", "POST")
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Error al generar recomendaciones")
      setRecipes(data.recommendations.recipes)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al generar recomendaciones")
    } finally {
      setRegenerating(false)
    }
  }

  async function handleSaveToDishes(recipe: CookingRecipe) {
    if (!user) return
    setSavingId(recipe.id)
    const saved = await createDish(user.id, {
      nombre: recipe.nombre,
      ingredientes: recipe.ingredientes,
      calorias: recipe.calorias,
      proteinas_g: recipe.proteinas_g,
      carbohidratos_g: recipe.carbohidratos_g,
      grasas_g: recipe.grasas_g,
      instrucciones: recipe.instrucciones,
      origen: "recomendado",
    })
    if (saved) setSavedIds((prev) => new Set(prev).add(recipe.id))
    setSavingId(null)
  }

  const categoryRecipes = recipes.filter((r) => r.categoria === category)

  if (detail) {
    const fit = computeMacroFit(detail, remaining)
    const alreadySaved = savedIds.has(detail.id)
    return (
      <div className="flex flex-col gap-5 px-4 pb-4 pt-8">
        <button type="button" onClick={() => setDetail(null)} className="self-start text-sm font-medium text-muted-foreground">
          ← Volver
        </button>

        <img
          src={getGenericImage(detail.categoria, recipes.filter((r) => r.categoria === detail.categoria).indexOf(detail))}
          alt=""
          className="h-48 w-full rounded-2xl object-cover"
        />

        <div>
          <h1 className="text-xl font-bold tracking-tight">{detail.nombre}</h1>
          <p className="mt-1 text-xs font-medium text-muted-foreground">{fit.label}</p>
        </div>

        <div className="grid grid-cols-4 gap-2 rounded-xl bg-muted/50 p-4 text-center text-xs">
          <div>
            <p className="font-bold tabular-nums text-food">{detail.calorias}</p>
            <p className="text-muted-foreground">kcal</p>
          </div>
          <div>
            <p className="font-bold tabular-nums">{detail.proteinas_g}g</p>
            <p className="text-muted-foreground">Prot</p>
          </div>
          <div>
            <p className="font-bold tabular-nums">{detail.carbohidratos_g}g</p>
            <p className="text-muted-foreground">Carb</p>
          </div>
          <div>
            <p className="font-bold tabular-nums">{detail.grasas_g}g</p>
            <p className="text-muted-foreground">Gras</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="size-3.5" />
            {detail.tiempo_preparacion_min} min
          </span>
          <span className="capitalize">Dificultad: {detail.dificultad}</span>
        </div>

        <Card className="gap-2 px-4">
          <h2 className="text-sm font-semibold">Ingredientes</h2>
          <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
            {detail.ingredientes.map((ing, i) => (
              <li key={i}>
                {ing.cantidad}{ing.unidad ?? "g"} de {ing.nombre}
              </li>
            ))}
          </ul>
        </Card>

        <Card className="gap-2 px-4">
          <h2 className="text-sm font-semibold">Preparación</h2>
          <p className="whitespace-pre-line text-sm text-muted-foreground">{detail.instrucciones}</p>
        </Card>

        <Button
          className="h-12 w-full gap-2 disabled:opacity-50"
          onClick={() => handleSaveToDishes(detail)}
          disabled={savingId === detail.id || alreadySaved}
        >
          {savingId === detail.id ? <Loader2 className="size-4 animate-spin" /> : null}
          {alreadySaved ? "Guardado en Mis platos" : "Guardar en Mis platos"}
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 px-4 pb-4 pt-8">
      <div className="flex items-center justify-between">
        <button type="button" onClick={onBack} className="text-sm font-medium text-muted-foreground">
          ← Volver a Cocina
        </button>
        <button
          type="button"
          onClick={handleRegenerate}
          disabled={regenerating}
          className="flex items-center gap-1 text-xs font-medium text-muted-foreground disabled:opacity-50"
        >
          {regenerating ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
          Renovar ahora
        </button>
      </div>

      <header>
        <h1 className="text-2xl font-bold tracking-tight">Platos recomendados</h1>
        <p className="text-sm text-muted-foreground">Se renuevan automáticamente cada 5 días</p>
      </header>

      <div className="grid grid-cols-4 gap-1 rounded-xl bg-muted p-1">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCategory(c.id)}
            className={`h-9 rounded-lg text-xs font-medium transition-colors ${
              category === c.id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

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
          <div className="h-28 w-full animate-pulse rounded-xl bg-muted" />
          <div className="h-28 w-full animate-pulse rounded-xl bg-muted" />
          <div className="h-28 w-full animate-pulse rounded-xl bg-muted" />
        </div>
      )}

      {!loading && (
        <ul className="flex flex-col gap-3">
          {categoryRecipes.map((recipe, i) => {
            const fit = computeMacroFit(recipe, remaining)
            return (
              <li key={recipe.id}>
                <button type="button" onClick={() => setDetail(recipe)} className="w-full text-left">
                  <Card className="flex-row items-center gap-3 p-3">
                    <img
                      src={getGenericImage(recipe.categoria, i)}
                      alt=""
                      className="size-16 shrink-0 rounded-xl object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{recipe.nombre}</p>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Flame className="size-3" />
                        {recipe.calorias} kcal · P{recipe.proteinas_g} C{recipe.carbohidratos_g} G{recipe.grasas_g}
                      </p>
                      <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">{fit.label}</p>
                    </div>
                  </Card>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}