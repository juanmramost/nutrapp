import supabase from "./supabaseClient"
import type { DishIngredient, DishOrigin, SavedDish } from "./types"

interface DishRow {
  id: string
  nombre: string
  ingredientes: DishIngredient[]
  calorias: number
  proteinas_g: number
  carbohidratos_g: number
  grasas_g: number
  instrucciones: string | null
  origen: DishOrigin
  created_at: string
}

function rowToDish(row: DishRow): SavedDish {
  return {
    id: row.id,
    nombre: row.nombre,
    ingredientes: row.ingredientes ?? [],
    calorias: row.calorias,
    proteinas_g: row.proteinas_g,
    carbohidratos_g: row.carbohidratos_g,
    grasas_g: row.grasas_g,
    instrucciones: row.instrucciones ?? undefined,
    origen: row.origen,
    created_at: row.created_at,
  }
}

export async function listDishes(userId: string): Promise<SavedDish[]> {
  const { data, error } = await supabase
    .from("saved_dishes")
    .select("id, nombre, ingredientes, calorias, proteinas_g, carbohidratos_g, grasas_g, instrucciones, origen, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("dishes:listDishes error", error)
    return []
  }
  return (data ?? []).map(rowToDish)
}

export interface NewDishInput {
  nombre: string
  ingredientes: DishIngredient[]
  calorias: number
  proteinas_g: number
  carbohidratos_g: number
  grasas_g: number
  instrucciones?: string
  origen?: DishOrigin
}

export async function createDish(userId: string, input: NewDishInput): Promise<SavedDish | null> {
  const { data, error } = await supabase
    .from("saved_dishes")
    .insert({
      user_id: userId,
      nombre: input.nombre,
      ingredientes: input.ingredientes,
      calorias: input.calorias,
      proteinas_g: input.proteinas_g,
      carbohidratos_g: input.carbohidratos_g,
      grasas_g: input.grasas_g,
      instrucciones: input.instrucciones ?? null,
      origen: input.origen ?? "manual",
    })
    .select("id, nombre, ingredientes, calorias, proteinas_g, carbohidratos_g, grasas_g, instrucciones, origen, created_at")
    .single()

  if (error) {
    console.error("dishes:createDish error", error)
    return null
  }
  return rowToDish(data)
}

export interface UpdateDishInput {
  nombre?: string
  ingredientes?: DishIngredient[]
  calorias?: number
  proteinas_g?: number
  carbohidratos_g?: number
  grasas_g?: number
  instrucciones?: string
}

export async function updateDish(dishId: string, patch: UpdateDishInput): Promise<boolean> {
  const { error } = await supabase
    .from("saved_dishes")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", dishId)

  if (error) {
    console.error("dishes:updateDish error", error)
    return false
  }
  return true
}

export async function deleteDish(dishId: string): Promise<boolean> {
  const { error } = await supabase.from("saved_dishes").delete().eq("id", dishId)
  if (error) {
    console.error("dishes:deleteDish error", error)
    return false
  }
  return true
}