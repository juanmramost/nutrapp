import type { FoodAnalysis, WorkoutAnalysis } from "./types"

export interface ImagePart {
  mimeType: string
  /** Base64 sin el prefijo data: */
  data: string
}

/** Convierte un File a { mimeType, data(base64) } para enviar al servidor. */
export function fileToImagePart(file: File): Promise<ImagePart> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      const base64 = result.split(",")[1] ?? ""
      resolve({ mimeType: file.type || "image/jpeg", data: base64 })
    }
    reader.onerror = () => reject(new Error("No se pudo leer la imagen"))
    reader.readAsDataURL(file)
  })
}

/** Llama a la ruta de servidor /api/analyze, que guarda la clave de Gemini de forma segura. */
async function analyze<T>(type: "food" | "workout", image: ImagePart): Promise<T> {
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, image }),
  })

  const payload = await res.json().catch(() => null)

  if (!res.ok) {
    throw new Error(payload?.error ?? "No se pudo analizar la imagen. Inténtalo de nuevo.")
  }
  if (!payload?.data) {
    throw new Error("La IA no devolvió resultados. Prueba con otra foto.")
  }
  return payload.data as T
}

export function analyzeFood(image: ImagePart): Promise<FoodAnalysis> {
  return analyze<FoodAnalysis>("food", image)
}

export function analyzeWorkout(image: ImagePart): Promise<WorkoutAnalysis> {
  return analyze<WorkoutAnalysis>("workout", image)
}
