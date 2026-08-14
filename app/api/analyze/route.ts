import { type NextRequest, NextResponse } from "next/server"

const MODEL = "gemini-3.5-flash"
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`

interface ImagePart {
  mimeType: string
  data: string
}

const FOOD_SYSTEM =
  "Eres un experto nutricionista. Analiza la foto de comida proporcionada y devuelve UNICAMENTE un objeto JSON con las calorías estimadas, macronutrientes e ingredientes principales. Sé conciso y riguroso."

const WORKOUT_SYSTEM =
  "Analiza esta captura de entrenamiento (reloj, app o máquina de gimnasio). Extrae las calorías activas quemadas y el tipo de actividad realizada. Devuelve UNICAMENTE un JSON con tipo_actividad (string) y calorias_activas (number)."

const FOOD_SCHEMA = {
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
}

const WORKOUT_SCHEMA = {
  type: "object",
  properties: {
    tipo_actividad: { type: "string" },
    calorias_activas: { type: "number" },
  },
  required: ["tipo_actividad", "calorias_activas"],
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: "El servidor no tiene configurada la clave de Gemini." },
      { status: 500 },
    )
  }

  let body: { type?: "food" | "workout"; image?: ImagePart; prompt?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Petición inválida." }, { status: 400 })
  }

  const { type, image } = body
  if (!image?.data || (type !== "food" && type !== "workout")) {
    return NextResponse.json({ error: "Faltan datos de la imagen." }, { status: 400 })
  }

  const isFood = type === "food"
  const systemInstruction = isFood ? FOOD_SYSTEM : WORKOUT_SYSTEM
  const responseSchema = isFood ? FOOD_SCHEMA : WORKOUT_SCHEMA
  const prompt = isFood ? "Analiza este plato de comida." : "Extrae los datos de este entrenamiento."

  const res = await fetch(`${ENDPOINT}?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemInstruction }] },
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            { inlineData: { mimeType: image.mimeType, data: image.data } },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema,
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
    return NextResponse.json(
      { error: `Error de Gemini (${res.status}). ${detail}`.trim() },
      { status: 502 },
    )
  }

  const json = await res.json()
  const text: string | undefined = json?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) {
    return NextResponse.json(
      { error: "Gemini no devolvió resultados. Prueba con otra foto." },
      { status: 502 },
    )
  }

  try {
    return NextResponse.json({ data: JSON.parse(text) })
  } catch {
    return NextResponse.json(
      { error: "No se pudo interpretar la respuesta de la IA." },
      { status: 502 },
    )
  }
}
