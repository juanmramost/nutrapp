const MODEL = "gemini-3.5-flash"
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`

export interface WhatToCookIngredient {
  nombre: string
  cantidad: number
  unidad: string
  /** true si la IA lo sugiere además de lo que el usuario ya tiene. */
  adicional: boolean
}

export interface WhatToCookRecipe {
  id: string
  nombre: string
  ingredientes: WhatToCookIngredient[]
  calorias: number
  proteinas_g: number
  carbohidratos_g: number
  grasas_g: number
  instrucciones: string
  tiempo_preparacion_min: number
}

const SYSTEM_INSTRUCTION = `Eres un chef y nutricionista práctico. El usuario te dice, en texto libre, qué ingredientes tiene disponibles (con o sin cantidades). Tu tarea es proponer EXACTAMENTE 3 recetas distintas entre sí (no variaciones mínimas del mismo plato) usando prioritariamente esos ingredientes.

Reglas:
- Usa como base los ingredientes que el usuario mencionó. Si necesitas algún ingrediente extra razonable para completar la receta, indícalo marcándolo como adicional=true.
- Si el usuario dio cantidades, respétalas. Si no, estima cantidades razonables por receta.
- Ten en cuenta el contexto nutricional del usuario (lo que le queda por consumir hoy) como ORIENTACIÓN, nunca como restricción rígida: prioridad proteína > calorías > carbohidratos > grasas. Una receta puede superar ligeramente lo que queda si es una buena opción nutricional.
- Las 3 recetas deben ser prácticas, saludables y realizables con ingredientes comunes.
- Calcula calorías y macros de forma realista según las cantidades de cada receta.
- Devuelve ÚNICAMENTE un array JSON con las 3 recetas, sin texto adicional ni markdown.

Cada receta debe tener:
- nombre: string
- ingredientes: array de { nombre, cantidad (número), unidad (ej. "g", "ml", "unidad"), adicional (boolean: true si NO estaba en la lista del usuario) }
- calorias, proteinas_g, carbohidratos_g, grasas_g: números enteros
- instrucciones: string breve con los pasos, en un bloque de texto con saltos de línea
- tiempo_preparacion_min: número entero`

const RESPONSE_SCHEMA = {
  type: "array",
  items: {
    type: "object",
    properties: {
      nombre: { type: "string" },
      ingredientes: {
        type: "array",
        items: {
          type: "object",
          properties: {
            nombre: { type: "string" },
            cantidad: { type: "number" },
            unidad: { type: "string" },
            adicional: { type: "boolean" },
          },
          required: ["nombre", "cantidad", "adicional"],
        },
      },
      calorias: { type: "number" },
      proteinas_g: { type: "number" },
      carbohidratos_g: { type: "number" },
      grasas_g: { type: "number" },
      instrucciones: { type: "string" },
      tiempo_preparacion_min: { type: "number" },
    },
    required: [
      "nombre",
      "ingredientes",
      "calorias",
      "proteinas_g",
      "carbohidratos_g",
      "grasas_g",
      "instrucciones",
      "tiempo_preparacion_min",
    ],
  },
}

export async function generateWhatToCook(userContext: string, apiKey: string): Promise<WhatToCookRecipe[]> {
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

  let raw: Omit<WhatToCookRecipe, "id">[]
  try {
    raw = JSON.parse(text) as Omit<WhatToCookRecipe, "id">[]
  } catch {
    throw new Error("No se pudo interpretar la respuesta de la IA.")
  }

  return raw.map((r, i) => ({
    id: `${Date.now()}-${i}`,
    nombre: r.nombre,
    ingredientes: r.ingredientes.map((ing) => ({
      nombre: ing.nombre,
      cantidad: Math.round(ing.cantidad),
      unidad: ing.unidad || "g",
      adicional: Boolean(ing.adicional),
    })),
    calorias: Math.round(r.calorias),
    proteinas_g: Math.round(r.proteinas_g),
    carbohidratos_g: Math.round(r.carbohidratos_g),
    grasas_g: Math.round(r.grasas_g),
    instrucciones: r.instrucciones,
    tiempo_preparacion_min: Math.round(r.tiempo_preparacion_min),
  }))
}