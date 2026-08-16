import type { FoodAnalysis, WorkoutAnalysis } from "./types"
 
const MODEL = "gemini-3.5-flash"
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

/**
 * Redimensiona y comprime una imagen en el cliente antes de enviarla.
 * Devuelve un nuevo `File` en formato `image/jpeg`.
 */
export async function resizeImage(file: File, maxDim = 1024, quality = 0.75): Promise<File> {
  if (!file.type.startsWith("image/")) return file

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const i = new Image()
    i.onload = () => {
      URL.revokeObjectURL(url)
      resolve(i)
    }
    i.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error("No se pudo cargar la imagen para redimensionar"))
    }
    i.src = url
  })

  const max = Math.max(img.width, img.height)
  if (max <= maxDim) {
    // No hace falta redimensionar
    return file
  }

  const scale = maxDim / max
  const w = Math.round(img.width * scale)
  const h = Math.round(img.height * scale)

  const canvas = document.createElement("canvas")
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("No se pudo obtener el contexto de canvas")
  ctx.drawImage(img, 0, 0, w, h)

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality))
  if (!blob) throw new Error("No se pudo generar la imagen comprimida")

  // Crear un nuevo File con el mismo nombre pero forzando jpeg
  const name = file.name.replace(/\.[^.]+$/, "") + ".jpg"
  return new File([blob], name, { type: "image/jpeg" })
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
 
const FOOD_SYSTEM = `Eres un experto nutricionista. Analizarás UNA SOLA FOTO de comida y, opcionalmente, notas adicionales proporcionadas por el usuario.

Reglas estrictas:
- Si el usuario incluye notas, trátalas como VERDAD y dales PRIORIDAD sobre la interpretación visual en caso de conflicto (ej.: si el usuario indica "sin aceite", confía en la nota aunque la imagen parezca aceitosa).
- Usa la foto para identificar el plato, la porción y los ingredientes visibles.
- Usa las notas del usuario para precisar cantidades, ingredientes no visibles, marcas o modificaciones de la receta.
- No inventes ingredientes que no estén ni en la foto ni en las notas. Si sospechas algo pero no está claro, NO lo incluyas.
- Devuelve ÚNICAMENTE un objeto JSON válido y nada más (sin texto explicativo, sin comentarios).

Formato requerido (campos exactos):
- 'plato': string (nombre del plato)
- 'calorias_totales': number (kcal, entero redondeado)
- 'proteinas_g': number (gramos, entero redondeado)
- 'carbohidratos_g': number (gramos, entero redondeado)
- 'grasas_g': number (gramos, entero redondeado)
- 'ingredientes': array de strings (ingredientes principales; solo visibles o mencionados)
- 'confianza_estimacion': string (una de "alta" | "media" | "baja")

Reglas numéricas y de redondeo:
- Redondea todos los números a enteros.
- 'calorias_totales' en kcal; macros en gramos.
- Si hay varios componentes, devuelve el total combinado.

Ejemplo de salida JSON exacta (usa este esquema):
{
  "plato":"Tostada integral con aguacate y claras",
  "calorias_totales":340,
  "proteinas_g":11,
  "carbohidratos_g":27,
  "grasas_g":19,
  "ingredientes":["pan integral","aguacate","huevo (2 claras + 1 yema)","aceite de oliva"],
  "confianza_estimacion":"alta"
}

Instrucción final: aplica las reglas anteriores. Si el usuario proporcionó detalles, inclúyelos literalmente y priorízalos. NO devuelvas texto fuera del JSON y sigue exactamente el formato solicitado.`
 
export function analyzeFood(image: ImagePart, apiKey: string, details?: string): Promise<FoodAnalysis> {
  const promptBase = "Analiza este plato de comida."
  const prompt = details && details.trim().length > 0 ? `${promptBase} Información adicional del usuario: ${details}. Usa esta información al estimar ingredientes y cantidades.` : promptBase

  return generateJson<FoodAnalysis>({
    apiKey,
    systemInstruction: FOOD_SYSTEM,
    prompt,
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
