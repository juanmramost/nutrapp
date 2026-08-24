"use client"

import { useEffect, useMemo, useState } from "react"
import { Clock, Flame, Loader2, Plus, Search, Trash2, TriangleAlert } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { getGenericImage } from "@/lib/dish-images"
import { listDishes, deleteDish } from "@/lib/dishes"
import type { SavedDish } from "@/lib/types"

interface Props {
  onBack: () => void
  onNavigateToCreate?: () => void
}

export function MisPlatosView({ onBack, onNavigateToCreate }: Props) {
  const { user } = useAuth()
  const [dishes, setDishes] = useState<SavedDish[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [selectedDish, setSelectedDish] = useState<SavedDish | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    async function fetchDishes() {
      if (!user) return
      setLoading(true)
      setError(null)
      try {
        const data = await listDishes(user.id)
        setDishes(data)
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error al cargar mis platos")
      } finally {
        setLoading(false)
      }
    }
    fetchDishes()
  }, [user])

  const filteredDishes = useMemo(() => {
    return dishes.filter((d) => d.nombre.toLowerCase().includes(search.toLowerCase()))
  }, [dishes, search])

  async function handleDelete(id: string) {
    setDeletingId(id)
    const success = await deleteDish(id)
    if (success) {
      setDishes((prev) => prev.filter((d) => d.id !== id))
      if (selectedDish?.id === id) setSelectedDish(null)
    }
    setDeletingId(null)
  }

  if (selectedDish) {
    return (
      <div className="flex flex-col gap-5 px-4 pb-4 pt-8">
        <button type="button" onClick={() => setSelectedDish(null)} className="self-start text-sm font-medium text-muted-foreground">
          ← Volver a Mis platos
        </button>

        <img
          src={getGenericImage({ nombre: selectedDish.nombre, categoria: "almuerzo" }, 0)}
          alt={selectedDish.nombre}
          className="h-48 w-full rounded-2xl object-cover"
        />

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">{selectedDish.nombre}</h1>
            <p className="text-xs capitalize text-muted-foreground">Origen: {selectedDish.origen.replace("_", " ")}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:bg-destructive/10"
            onClick={() => handleDelete(selectedDish.id)}
            disabled={deletingId === selectedDish.id}
          >
            {deletingId === selectedDish.id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
          </Button>
        </div>

        <div className="grid grid-cols-4 gap-2 rounded-xl bg-muted/50 p-4 text-center text-xs">
          <div>
            <p className="font-bold tabular-nums text-food">{selectedDish.calorias}</p>
            <p className="text-muted-foreground">kcal</p>
          </div>
          <div>
            <p className="font-bold tabular-nums">{selectedDish.proteinas_g}g</p>
            <p className="text-muted-foreground">Prot</p>
          </div>
          <div>
            <p className="font-bold tabular-nums">{selectedDish.carbohidratos_g}g</p>
            <p className="text-muted-foreground">Carb</p>
          </div>
          <div>
            <p className="font-bold tabular-nums">{selectedDish.grasas_g}g</p>
            <p className="text-muted-foreground">Gras</p>
          </div>
        </div>

        {selectedDish.ingredientes.length > 0 && (
          <Card className="gap-2 px-4">
            <h2 className="text-sm font-semibold">Ingredientes</h2>
            <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
              {selectedDish.ingredientes.map((ing, i) => (
                <li key={i}>
                  {ing.cantidad}{ing.unidad ?? "g"} de {ing.nombre}
                </li>
              ))}
            </ul>
          </Card>
        )}

        {selectedDish.instrucciones && (
          <Card className="gap-2 px-4">
            <h2 className="text-sm font-semibold">Preparación</h2>
            <p className="whitespace-pre-line text-sm text-muted-foreground">{selectedDish.instrucciones}</p>
          </Card>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 px-4 pb-4 pt-8">
      <div className="flex items-center justify-between">
        <button type="button" onClick={onBack} className="text-sm font-medium text-muted-foreground">
          ← Volver a Cocina
        </button>
        {onNavigateToCreate && (
          <Button size="sm" onClick={onNavigateToCreate} className="gap-1 text-xs">
            <Plus className="size-3.5" />
            Nuevo plato
          </Button>
        )}
      </div>

      <header>
        <h1 className="text-2xl font-bold tracking-tight">Mis platos</h1>
        <p className="text-sm text-muted-foreground">Recetas guardadas para consultar o volver a cocinar</p>
      </header>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar plato..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-input bg-transparent py-2.5 pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
        />
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
          <div className="h-20 w-full animate-pulse rounded-xl bg-muted" />
          <div className="h-20 w-full animate-pulse rounded-xl bg-muted" />
        </div>
      )}

      {!loading && filteredDishes.length === 0 && (
        <Card className="p-8 text-center text-muted-foreground">
          <p className="text-sm">No tienes ningún plato guardado.</p>
        </Card>
      )}

      {!loading && filteredDishes.length > 0 && (
        <ul className="flex flex-col gap-3">
          {filteredDishes.map((dish, i) => (
            <li key={dish.id}>
              <button type="button" onClick={() => setSelectedDish(dish)} className="w-full text-left">
                <Card className="flex-row items-center gap-3 p-3">
                  <img
                    src={getGenericImage({ nombre: dish.nombre, categoria: "almuerzo" }, i)}
                    alt={dish.nombre}
                    className="size-16 shrink-0 rounded-xl object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{dish.nombre}</p>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Flame className="size-3" />
                      {dish.calorias} kcal · P{dish.proteinas_g} C{dish.carbohidratos_g} G{dish.grasas_g}
                    </p>
                  </div>
                </Card>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}