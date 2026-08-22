import type { CookingRecipe, UserProfile } from "./types"
import type { DayTotals } from "./nutrition"

export interface RemainingMacros {
  kcal: number
  proteinas_g: number
  carbohidratos_g: number
  grasas_g: number
}

/**
 * Calcula lo que le queda por consumir al usuario hoy, reutilizando los mismos
 * objetivos ya usados en el dashboard (proteína = peso*2g, carbos/grasas = los
 * máximos ya mostrados en las barras de Macronutrientes). No crea un sistema
 * de objetivos nuevo, solo reutiliza los valores que la app ya calcula.
 */
export function getRemainingMacros(profile: UserProfile, totals: DayTotals): RemainingMacros {
  const proteinTarget = Math.round(profile.peso_kg * 2)
  const carbTarget = 300
  const fatTarget = 80
  // Presupuesto calórico del día: gasto total (basal + activo). Si el objetivo es
  // ganar músculo, se permite un pequeño margen extra.
  const kcalTarget = profile.objetivo === "ganar_musculo" ? Math.round(totals.gastoTotal * 1.1) : totals.gastoTotal

  return {
    kcal: Math.max(0, kcalTarget - totals.ingeridas),
    proteinas_g: Math.max(0, proteinTarget - totals.proteinas),
    carbohidratos_g: Math.max(0, carbTarget - totals.carbohidratos),
    grasas_g: Math.max(0, fatTarget - totals.grasas),
  }
}

export type MacroFitLevel = "excelente" | "buena" | "aceptable"

export interface MacroFitResult {
  level: MacroFitLevel
  label: string
}

/**
 * Compara una receta con lo que le queda al usuario por consumir. Los macros son
 * una orientación, no una restricción rígida: prioridad proteína > kcal > carbos > grasas.
 */
export function computeMacroFit(recipe: CookingRecipe, remaining: RemainingMacros): MacroFitResult {
  // Si no queda casi nada de presupuesto (ya comió mucho hoy), no penalizamos duro,
  // solo evitamos falsos "excelente".
  const kcalRatio = remaining.kcal > 0 ? recipe.calorias / remaining.kcal : 2
  const proteinRatio = remaining.proteinas_g > 0 ? recipe.proteinas_g / remaining.proteinas_g : 1

  const kcalFits = kcalRatio <= 1.15
  const kcalCloseEnough = kcalRatio <= 1.4
  const proteinGood = proteinRatio >= 0.5

  if (kcalFits && proteinGood) {
    return { level: "excelente", label: "✓ Encaja muy bien con tus macros" }
  }
  if (kcalCloseEnough) {
    return { level: "buena", label: "✓ Buena opción para tus macros" }
  }
  return { level: "aceptable", label: "○ Buena opción, aunque supera ligeramente tus macros restantes" }
}