import type { LogEntry, MealEntry, UserProfile, WorkoutEntry } from "./types"

/** Mifflin-St Jeor: tasa metabólica basal en reposo (kcal/día). */
export function calcBasal(profile: Pick<UserProfile, "peso_kg" | "altura_cm" | "edad" | "genero">): number {
  const base = 10 * profile.peso_kg + 6.25 * profile.altura_cm - 5 * profile.edad
  const bmr = profile.genero === "hombre" ? base + 5 : base - 161
  return Math.round(bmr)
}

export interface DayTotals {
  ingeridas: number
  proteinas: number
  carbohidratos: number
  grasas: number
  quemadasActivas: number
  basal: number
  /** Gasto total del día = basal + activas */
  gastoTotal: number
  /** Positivo = déficit (bien), negativo = superávit */
  deficitNeto: number
}

export function isMeal(e: LogEntry): e is MealEntry {
  return e.type === "meal"
}

export function isWorkout(e: LogEntry): e is WorkoutEntry {
  return e.type === "workout"
}

export function computeTotals(entries: LogEntry[], basal: number): DayTotals {
  let ingeridas = 0
  let proteinas = 0
  let carbohidratos = 0
  let grasas = 0
  let quemadasActivas = 0

  for (const e of entries) {
    if (isMeal(e)) {
      ingeridas += e.calorias
      proteinas += e.proteinas_g
      carbohidratos += e.carbohidratos_g
      grasas += e.grasas_g
    } else {
      quemadasActivas += e.calorias_activas
    }
  }

  const gastoTotal = basal + quemadasActivas
  const deficitNeto = gastoTotal - ingeridas

  return {
    ingeridas: Math.round(ingeridas),
    proteinas: Math.round(proteinas),
    carbohidratos: Math.round(carbohidratos),
    grasas: Math.round(grasas),
    quemadasActivas: Math.round(quemadasActivas),
    basal: Math.round(basal),
    gastoTotal: Math.round(gastoTotal),
    deficitNeto: Math.round(deficitNeto),
  }
}
