import type { CookingRecipe } from "./types"

const MODEL = "gemini-3.5-flash"
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`

const SYSTEM_INSTRUCTION = `Eres un chef y nutricionista experto. Generas recetas saludables, nutritivas, ricas en proteína y relativamente bajas en calorías, pensadas para el objetivo concreto de un usuario.

EXCEPCIÓN: los postres no tienen que ser altos en proteína, pero deben seguir siendo opciones razonables nutricionalmente (nada extremadamente calórico o restrictivo).

Debes generar EXACTAMENTE 24 recetas: 6 de categoría "desayuno", 6 de "almuerzo", 6 de "postre" y 6 de "cena". Las 6 de cada categoría deben ser claramente distintas entre sí (no variaciones mínimas del mismo plato).

Para cada receta incluye:
- categoria: "desayuno" | "almuerzo" | "postre" | "cena"
- nombre: string, corto y apetecible
- ingredientes: array de objetos { nombre, cantidad (número), unidad (ej. "g", "ml", "unidad") }
- calorias, proteinas_g, carbohidratos_g, grasas_g: números enteros, calculados de forma realista a partir de los ingredientes
- instrucciones: string breve con los pasos de preparación (3-6 pasos, en un solo bloque de texto separado por saltos de línea)
- tiempo_preparacion_min: número entero
- dificultad: "facil" | "media" | "dificil"
- imagen_query: UNA palabra clave simple en español que resuma el plato para elegir una foto genérica (ej. "pollo", "ensalada", "pasta", "batido", "tarta", "sopa", "pescado", "avena")

No expliques nada fuera del JSON. Devuelve ÚNICAMENTE un array JSON con las 24 recetas, sin texto adicional, sin markdown.`

interface RawRecipe {
  categoria: string
  nombre: string
  ingredientes: { nombre: string; cantidad: number; unidad?: string }[]
  calorias: number
  proteinas_g: number
  carbohidratos_g: number
  grasas_g: number
  instrucciones: string
  tiempo_preparacion_min: number
  dificultad: string
  imagen_query: string
}

const RESPONSE_SCHEMA = {
  type: "array",
  items: {
    type: "object",
    properties: {
      categoria: { type: "string", enum: ["desayuno", "almuerzo", "postre", "cena"] },
      nombre: { type: "string" },
      ingredientes: {
        type: "array",
        items: {
          type: "object",
          properties: {
            nombre: { type: "string" },
            cantidad: { type: "number" },
            unidad: { type: "string" },
          },
          required: ["nombre", "cantidad"],
        },
      },
      calorias: { type: "number" },
      proteinas_g: { type: "number" },
      carbohidratos_g: { type: "number" },
      grasas_g: { type: "number" },
      instrucciones: { type: "string" },
      tiempo_preparacion_min: { type: "number" },
      dificultad: { type: "string", enum: ["facil", "media", "dificil"] },
      imagen_query: { type: "string" },
    },
    required: [
      "categoria",
      "nombre",
      "ingredientes",
      "calorias",
      "proteinas_g",
      "carbohidratos_g",
      "grasas_g",
      "instrucciones",
      "tiempo_preparacion_min",
      "dificultad",
      "imagen_query",
    ],
  },
}

export async function generateCookingRecommendations(
  userContext: string,
  apiKey: string,
): Promise<CookingRecipe[]> {
  if (!apiKey) throw new Error("Falta la API Key de Gemini.")

  const res = await fetch(`${ENDPOINT}?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
      contents: [{ role: "user", parts: [{ text: userContext }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
        temperature: 0.7,
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
    throw new Error(`Error de Gemini (${res.status}). ${detail}`.trim())
  }

  const json = await res.json()
  const text: string | undefined = json?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error("Gemini no devolvió resultados.")

  let raw: RawRecipe[]
  try {
    raw = JSON.parse(text) as RawRecipe[]
  } catch {
    throw new Error("No se pudo interpretar la respuesta de la IA.")
  }

  return raw.map((r, i) => ({
    id: `${Date.now()}-${i}`,
    categoria: r.categoria as CookingRecipe["categoria"],
    nombre: r.nombre,
    ingredientes: r.ingredientes.map((ing) => ({ nombre: ing.nombre, cantidad: ing.cantidad, unidad: ing.unidad ?? "g" })),
    calorias: Math.round(r.calorias),
    proteinas_g: Math.round(r.proteinas_g),
    carbohidratos_g: Math.round(r.carbohidratos_g),
    grasas_g: Math.round(r.grasas_g),
    instrucciones: r.instrucciones,
    tiempo_preparacion_min: Math.round(r.tiempo_preparacion_min),
    dificultad: (r.dificultad as CookingRecipe["dificultad"]) ?? "media",
    imagen_query: r.imagen_query,
  }))
}