export type Genero = "hombre" | "mujer"

export interface UserProfile {
  peso_kg: number
  altura_cm: number
  edad: number
  genero: Genero
  /** Calorías basales/reposo diarias (TDEE en reposo). Puede calcularse o ajustarse a mano. */
  tdee_basal: number
  /** Si true, tdee_basal se recalcula automáticamente con Mifflin-St Jeor. */
  auto_basal: boolean
}

export interface MealEntry {
  id: string
  type: "meal"
  plato: string
  calorias: number
  proteinas_g: number
  carbohidratos_g: number
  grasas_g: number
  ingredientes: string[]
  confianza?: string
  detalles?: string
  createdAt: number
}

export interface WorkoutEntry {
  id: string
  type: "workout"
  tipo_actividad: string
  calorias_activas: number
  createdAt: number
}

export type LogEntry = MealEntry | WorkoutEntry

/** daily_logs: mapa fecha (YYYY-MM-DD) -> lista de registros. */
export type DailyLogs = Record<string, LogEntry[]>

export interface FoodAnalysis {
  plato: string
  calorias_totales: number
  proteinas_g: number
  carbohidratos_g: number
  grasas_g: number
  ingredientes: string[]
  confianza_estimacion: string
}

export interface WorkoutAnalysis {
  tipo_actividad: string
  calorias_activas: number
}
