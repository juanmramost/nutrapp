"use client"

import { useEffect, useState } from "react"
import { motion } from "motion/react"
import { BookOpen, Check, Loader2, Plus, Sparkles, Trash2, TriangleAlert, X } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/hooks/use-auth"
import supabase from "@/lib/supabaseClient"
import { listDishes, createDish, updateDish, deleteDish } from "@/lib/dishes"
import type { DishIngredient, FoodAnalysis, SavedDish } from "@/lib/types"

interface Props {
  onBack: () => void
}

interface IngredientDraft {
  nombre: string
  cantidad: string
  unidad: string
}

function emptyIngredient(): IngredientDraft {
  return { nombre: "", cantidad: "", unidad: "g" }
}

function emptyMacros() {
  return { calorias: 0, proteinas_g: 0, carbohidratos_g: 0, grasas_g: 0 }
}

const dishesCache = new Map<string, SavedDish[]>()
const dishesLoading = new Map<string, Promise<SavedDish[]>>()

async function getCachedDishes(userId: string): Promise<SavedDish[]> {
  const cached = dishesCache.get(userId)

  if (cached) {
    return cached
  }

  const existingRequest = dishesLoading.get(userId)

  if (existingRequest) {
    return existingRequest
  }

  const request = listDishes(userId).then((list) => {
    dishesCache.set(userId, list)
    dishesLoading.delete(userId)
    return list
  })

  dishesLoading.set(userId, request)

  return request
}

export function MisPlatosView({ onBack }: Props) {
  const { user } = useAuth()
  const [dishes, setDishes] = useState<SavedDish[]>([])
  const [loadingList, setLoadingList] = useState(true)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [nombre, setNombre] = useState("")
  const [ingredientes, setIngredientes] = useState<IngredientDraft[]>([emptyIngredient()])
  const [instrucciones, setInstrucciones] = useState("")
  const [macros, setMacros] = useState(emptyMacros())
  const [analyzed, setAnalyzed] = useState(false)

  const [analyzing, setAnalyzing] = useState(false)
  const [analyzeError, setAnalyzeError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!user) {
        setLoadingList(false)
        return
      }

      const cached = dishesCache.get(user.id)

      if (cached) {
        setDishes(cached)
        setLoadingList(false)
        return
      }

      setLoadingList(true)

      const list = await getCachedDishes(user.id)

      if (!cancelled) {
        setDishes(list)
        setLoadingList(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [user?.id])

  function updateDishesCache(userId: string, next: SavedDish[]) {
    dishesCache.set(userId, next)
    setDishes(next)
  }

  function resetForm() {
    setEditingId(null)
    setNombre("")
    setIngredientes([emptyIngredient()])
    setInstrucciones("")
    setMacros(emptyMacros())
    setAnalyzed(false)
    setAnalyzeError(null)
  }

  function openCreate() {
    resetForm()
    setShowForm(true)
  }

  function openEdit(dish: SavedDish) {
    setEditingId(dish.id)
    setNombre(dish.nombre)
    setIngredientes(
      dish.ingredientes.length > 0
        ? dish.ingredientes.map((i) => ({
            nombre: i.nombre,
            cantidad: String(i.cantidad),
            unidad: i.unidad ?? "g",
          }))
        : [emptyIngredient()],
    )
    setInstrucciones(dish.instrucciones ?? "")
    setMacros({
      calorias: dish.calorias,
      proteinas_g: dish.proteinas_g,
      carbohidratos_g: dish.carbohidratos_g,
      grasas_g: dish.grasas_g,
    })
    setAnalyzed(true)
    setAnalyzeError(null)
    setShowForm(true)
  }

  function updateIngredient(index: number, patch: Partial<IngredientDraft>) {
    setIngredientes((prev) =>
      prev.map((ing, i) => (i === index ? { ...ing, ...patch } : ing)),
    )
    setAnalyzed(false)
  }

  function addIngredientRow() {
    setIngredientes((prev) => [...prev, emptyIngredient()])
  }

  function removeIngredientRow(index: number) {
    setIngredientes((prev) =>
      prev.length > 1 ? prev.filter((_, i) => i !== index) : prev,
    )
    setAnalyzed(false)
  }

  const validIngredients = ingredientes.filter(
    (i) => i.nombre.trim().length > 0,
  )

  const canAnalyze =
    nombre.trim().length > 0 && validIngredients.length > 0

  async function handleAnalyze() {
    if (!canAnalyze) return

    setAnalyzing(true)
    setAnalyzeError(null)

    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const session = sessionData.session

      if (!session) {
        throw new Error("Inicia sesión para usar el análisis con IA")
      }

      const descripcion = `${nombre.trim()}: ${validIngredients
        .map(
          (i) =>
            `${i.cantidad || "cantidad no especificada"}${i.unidad} de ${i.nombre.trim()}`,
        )
        .join(", ")}`

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          mode: "food_text",
          description: descripcion,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.error || "Error al analizar el plato")
      }

      const analysis = data as FoodAnalysis

      setMacros({
        calorias: Math.round(analysis.calorias_totales),
        proteinas_g: Math.round(analysis.proteinas_g),
        carbohidratos_g: Math.round(analysis.carbohidratos_g),
        grasas_g: Math.round(analysis.grasas_g),
      })

      setAnalyzed(true)
    } catch (e) {
      setAnalyzeError(
        e instanceof Error ? e.message : "Error al analizar el plato",
      )
    } finally {
      setAnalyzing(false)
    }
  }

  async function handleSaveDish() {
    if (!user || !analyzed || !canAnalyze) return

    setSaving(true)

    try {
      const ingredientesFinal: DishIngredient[] = validIngredients.map((i) => ({
        nombre: i.nombre.trim(),
        cantidad: Number(i.cantidad) || 0,
        unidad: i.unidad || "g",
      }))

      if (editingId) {
        const ok = await updateDish(editingId, {
          nombre: nombre.trim(),
          ingredientes: ingredientesFinal,
          instrucciones: instrucciones.trim() || undefined,
          ...macros,
        })

        if (ok) {
          const next = dishes.map((dish) =>
            dish.id === editingId
              ? {
                  ...dish,
                  nombre: nombre.trim(),
                  ingredientes: ingredientesFinal,
                  instrucciones: instrucciones.trim() || undefined,
                  ...macros,
                }
              : dish,
          )

          updateDishesCache(user.id, next)
        }
      } else {
        const created = await createDish(user.id, {
          nombre: nombre.trim(),
          ingredientes: ingredientesFinal,
          instrucciones: instrucciones.trim() || undefined,
          origen: "manual",
          ...macros,
        })

        if (created) {
          const next = [created, ...dishes]
          updateDishesCache(user.id, next)
        }
      }

      setShowForm(false)
      resetForm()
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(dish: SavedDish) {
    const ok = window.confirm(
      `¿Eliminar "${dish.nombre}" de tus platos guardados?`,
    )

    if (!ok) return

    setDeletingId(dish.id)

    const success = await deleteDish(dish.id)

    if (success && user) {
      const next = dishes.filter((d) => d.id !== dish.id)
      updateDishesCache(user.id, next)
    }

    setDeletingId(null)
  }

  if (showForm) {
    return (
      <div className="flex flex-col gap-5 px-4 pb-4 pt-8">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              setShowForm(false)
              resetForm()
            }}
            className="text-sm font-medium text-muted-foreground"
          >
            ← Cancelar
          </button>

          <h1 className="text-lg font-bold">
            {editingId ? "Editar plato" : "Nuevo plato"}
          </h1>

          <div className="w-16" />
        </div>

        <Card className="gap-4 px-4">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">
              Nombre del plato
            </Label>

            <Input
              value={nombre}
              onChange={(e) => {
                setNombre(e.target.value)
                setAnalyzed(false)
              }}
              placeholder="Ej: Pollo con arroz"
              className="h-12"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-xs text-muted-foreground">
              Ingredientes
            </Label>

            {ingredientes.map((ing, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  value={ing.nombre}
                  onChange={(e) =>
                    updateIngredient(i, { nombre: e.target.value })
                  }
                  placeholder="Ingrediente"
                  className="h-11 flex-1"
                />

                <Input
                  type="number"
                  inputMode="numeric"
                  value={ing.cantidad}
                  onChange={(e) =>
                    updateIngredient(i, { cantidad: e.target.value })
                  }
                  placeholder="0"
                  className="h-11 w-20 tabular-nums"
                />

                <span className="w-8 shrink-0 text-center text-xs text-muted-foreground">
                  {ing.unidad}
                </span>

                <button
                  type="button"
                  onClick={() => removeIngredientRow(i)}
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                  aria-label="Quitar ingrediente"
                >
                  <X className="size-4" />
                </button>
              </div>
            ))}

            <Button
              variant="outline"
              className="h-10 gap-2"
              onClick={addIngredientRow}
            >
              <Plus className="size-4" />
              Añadir ingrediente
            </Button>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">
              Instrucciones (opcional)
            </Label>

            <textarea
              value={instrucciones}
              onChange={(e) => setInstrucciones(e.target.value)}
              placeholder="Pasos para prepararlo..."
              rows={3}
              className="w-full resize-none rounded-xl border border-input bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
            />
          </div>

          <Button
            className="h-12 w-full gap-2 bg-food text-food-foreground hover:bg-food/90 disabled:opacity-50"
            onClick={handleAnalyze}
            disabled={!canAnalyze || analyzing}
          >
            {analyzing ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4" />
            )}

            {analyzing ? "Analizando..." : "Analizar con IA"}
          </Button>

          {analyzeError && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <TriangleAlert className="size-4" />
              {analyzeError}
            </div>
          )}

          {analyzed && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl bg-muted/50 p-4"
            >
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Datos nutricionales estimados
              </p>

              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div>
                  <p className="font-bold tabular-nums text-food">
                    {macros.calorias}
                  </p>
                  <p className="text-muted-foreground">kcal</p>
                </div>

                <div>
                  <p className="font-bold tabular-nums">
                    {macros.proteinas_g}g
                  </p>
                  <p className="text-muted-foreground">Prot</p>
                </div>

                <div>
                  <p className="font-bold tabular-nums">
                    {macros.carbohidratos_g}g
                  </p>
                  <p className="text-muted-foreground">Carb</p>
                </div>

                <div>
                  <p className="font-bold tabular-nums">
                    {macros.grasas_g}g
                  </p>
                  <p className="text-muted-foreground">Gras</p>
                </div>
              </div>
            </motion.div>
          )}

          <Button
            className="h-12 w-full gap-2 disabled:opacity-50"
            onClick={handleSaveDish}
            disabled={!analyzed || saving}
          >
            {saving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Check className="size-4" />
            )}

            {saving ? "Guardando..." : "Guardar plato"}
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 px-4 pb-4 pt-8">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="text-sm font-medium text-muted-foreground"
        >
          ← Volver a Cocina
        </button>
      </div>

      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mis platos</h1>
          <p className="text-sm text-muted-foreground">
            Tus recetas guardadas, listas para reutilizar
          </p>
        </div>
      </header>

      <Button className="h-12 w-full gap-2" onClick={openCreate}>
        <Plus className="size-4" />
        Crear plato
      </Button>

      {loadingList && (
        <div className="flex flex-col gap-2">
          <div className="h-20 w-full animate-pulse rounded-xl bg-muted" />
          <div className="h-20 w-full animate-pulse rounded-xl bg-muted" />
        </div>
      )}

      {!loadingList && dishes.length === 0 && (
        <Card className="items-center gap-1 py-10 text-center">
          <BookOpen className="size-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Aún no has guardado ningún plato
          </p>
        </Card>
      )}

      <ul className="flex flex-col gap-2">
        {dishes.map((dish) => (
          <li key={dish.id}>
            <Card className="gap-2 p-4">
              <div className="flex items-start justify-between gap-2">
                <button
                  type="button"
                  onClick={() => openEdit(dish)}
                  className="min-w-0 flex-1 text-left"
                >
                  <p className="truncate text-sm font-semibold">
                    {dish.nombre}
                  </p>

                  <p className="text-xs text-muted-foreground">
                    {dish.calorias} kcal · P{dish.proteinas_g} C
                    {dish.carbohidratos_g} G{dish.grasas_g}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete(dish)}
                  disabled={deletingId === dish.id}
                  className="shrink-0 text-muted-foreground hover:text-destructive disabled:opacity-50"
                  aria-label="Eliminar plato"
                >
                  {deletingId === dish.id ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Trash2 className="size-4" />
                  )}
                </button>
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  )
}