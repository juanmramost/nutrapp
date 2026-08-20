export type Genero = "hombre" | "mujer"

export type Objetivo =
  | "perder_peso"
  | "ganar_musculo"
  | "mantener"
  | "mejorar_salud"

export type RecommendationTone = "positivo" | "ajuste_leve" | "atencion"

export interface UserProfile {
  peso_kg: number
  altura_cm: number
  edad: number
  genero: Genero
  objetivo: Objetivo
  /**
   * IMC indicado manualmente por el usuario. Si falta o no es válido,
   * se calcula automáticamente a partir de peso_kg y altura_cm.
   */
  imc?: number
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

export interface DailyRecommendation {
  fecha: string
  texto: string
  tono: RecommendationTone
  created_at: string
}

/** Un ingrediente dentro de un plato guardado por el usuario. */
export interface DishIngredient {
  nombre: string
  cantidad: number
  /** Unidad de medida, ej. "g", "ml", "unidad". Por defecto se asume "g". */
  unidad?: string
}

export type DishOrigin = "manual" | "recomendado" | "que_cocinar"

/** Un plato guardado permanentemente por el usuario en "Mis platos". */
export interface SavedDish {
  id: string
  nombre: string
  ingredientes: DishIngredient[]
  calorias: number
  proteinas_g: number
  carbohidratos_g: number
  grasas_g: number
  instrucciones?: string
  origen: DishOrigin
  created_at: string
}