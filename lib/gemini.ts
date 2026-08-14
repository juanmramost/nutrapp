import type { FoodAnalysis, WorkoutAnalysis } from "./types"

const MODEL = "gemini-2.5-flash"
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`

export interface ImagePart {
  mimeType: string
  /** Base64 sin el prefijo data: */
  data: string
}

/** Convierte un File a { mimeType, data(base64) } para enviar a Gemini. */
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

interface GenerateOptions {
  apiKey: string
  systemInstruction: string
  prompt: string
  image: ImagePart
  responseSchema: Record<string, unknown>
}

async function generateJson<T>(opts: GenerateOptions): Promise<T> {
  if (!opts.apiKey) {
    throw new Error("Falta la API Key de Gemini. Configúrala en Ajustes.")
  }

  const res = await fetch(`${ENDPOINT}?key=${encodeURIComponent(opts.apiKey)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: opts.systemInstruction }] },
      contents: [
        {
          role: "user",
          parts: [
            { text: opts.prompt },
            { inlineData: { mimeType: opts.image.mimeType, data: opts.image.data } },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: opts.responseSchema,
        temperature: 0.2,
      },
    }),
  })

  if (!res.ok) {
    let detail = ""
    try {
      const err = await res.json()
      detail = err?.error?.message ?? ""
    } catch {
      /* ignore */
    }
    if (res.status === 400 || res.status === 403) {
      throw new Error(`API Key inválida o sin permisos. ${detail}`.trim())
    }
    throw new Error(`Error de Gemini (${res.status}). ${detail}`.trim())
  }

  const json = await res.json()
  const text: string | undefined = json?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error("Gemini no devolvió resultados. Prueba con otra foto.")

  try {
    return JSON.parse(text) as T
  } catch {
    throw new Error("No se pudo interpretar la respuesta de la IA.")
  }
}

const FOOD_SYSTEM =
  "Eres un experto nutricionista. Analiza la foto de comida proporcionada y devuelve UNICAMENTE un objeto JSON con las calorías estimadas, macronutrientes e ingredientes principales. Sé conciso y riguroso."

export function analyzeFood(image: ImagePart, apiKey: string): Promise<FoodAnalysis> {
  return generateJson<FoodAnalysis>({
    apiKey,
    systemInstruction: FOOD_SYSTEM,
    prompt: "Analiza este plato de comida.",
    image,
    responseSchema: {
      type: "object",
      properties: {
        plato: { type: "string" },
        calorias_totales: { type: "number" },
        proteinas_g: { type: "number" },
        carbohidratos_g: { type: "number" },
        grasas_g: { type: "number" },
        ingredientes: { type: "array", items: { type: "string" } },
        confianza_estimacion: { type: "string" },
      },
      required: [
        "plato",
        "calorias_totales",
        "proteinas_g",
        "carbohidratos_g",
        "grasas_g",
        "ingredientes",
        "confianza_estimacion",
      ],
    },
  })
}

const WORKOUT_SYSTEM =
  "Analiza esta captura de entrenamiento (reloj, app o máquina de gimnasio). Extrae las calorías activas quemadas y el tipo de actividad realizada. Devuelve UNICAMENTE un JSON con tipo_actividad (string) y calorias_activas (number)."

export function analyzeWorkout(image: ImagePart, apiKey: string): Promise<WorkoutAnalysis> {
  return generateJson<WorkoutAnalysis>({
    apiKey,
    systemInstruction: WORKOUT_SYSTEM,
    prompt: "Extrae los datos de este entrenamiento.",
    image,
    responseSchema: {
      type: "object",
      properties: {
        tipo_actividad: { type: "string" },
        calorias_activas: { type: "number" },
      },
      required: ["tipo_actividad", "calorias_activas"],
    },
  })
}
