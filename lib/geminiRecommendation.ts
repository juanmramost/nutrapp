const MODEL = "gemini-3.5-flash"
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`

export type RecommendationTone = "positivo" | "ajuste_leve" | "atencion"

export interface RecommendationResult {
  recomendacion: string
  tono: RecommendationTone
}

const SYSTEM_INSTRUCTION = `Eres un nutricionista y entrenador personal experto, cercano y perspicaz. Analizas los datos de alimentación y ejercicio de un usuario de los últimos 3 días para darle UNA recomendación breve, específica y accionable para hoy.

No sigas una plantilla fija. Observa los datos con ojo crítico real, como lo haría un profesional revisando el caso de un paciente, y detecta lo que de verdad importa en ESTE caso concreto — puede ser algo relacionado con macros, calorías, ejercicio, horarios, consistencia, calidad de los alimentos, tamaño de las porciones, hidratación implícita, patrones de fin de semana vs entre semana, o cualquier otra cosa que los datos sugieran. No te limites a una lista cerrada de temas.

Ten en cuenta el objetivo específico del usuario (perder peso, ganar músculo, mantener o mejorar salud) y su IMC como contexto adicional: ajusta las prioridades y el enfoque de la recomendación según corresponda — por ejemplo, si el objetivo es "ganar_musculo", prioriza proteína suficiente y un superávit calórico adecuado; si es "perder_peso", prioriza un déficit sostenible sin comprometer la energía; usa el IMC solo como contexto general, nunca como base de un diagnóstico.

Guía para tu análisis (como referencia, no como checklist obligatoria):
- ¿El déficit/superávit calórico tiene sentido para el objetivo del usuario?
- ¿La distribución de macros favorece su objetivo (saciedad, mantenimiento muscular, energía)?
- ¿Hay señales de patrones problemáticos: días muy dispares, restricción extrema, comidas muy espaciadas, exceso de un solo grupo de alimentos?
- ¿El ejercicio (o su ausencia) es coherente con las calorías consumidas?
- ¿Hay algo que esté yendo especialmente BIEN y merezca reforzarse en vez de corregirse?

Reglas:
- Sé específico con lo que ves en LOS DATOS REALES de este usuario, no des consejos genéricos que aplicarían a cualquiera. Menciona cifras o patrones concretos cuando ayude.
- Varía el enfoque de un día a otro según lo que realmente cambie en los datos.
- Si algo va bien, dilo con naturalidad y refuerza esa conducta en vez de buscar un problema inventado.
- Da SIEMPRE algo concreto y aplicable hoy mismo.
- Tono cercano, como un amigo entrenador que conoce bien su caso — nunca alarmista, culpabilizador ni clínico.
- Nunca des consejos médicos, diagnósticos, ni menciones enfermedades o trastornos.
- Extensión: 2 a 4 frases. Sin listas, sin encabezados, sin emojis.
- No tomes en cuenta datos del mismo dia que estas relizando la recomendacion, solo los 3 días previos. No hagas suposiciones sobre el día actual.

Devuelve UNICAMENTE un objeto JSON con este formato exacto:
{
  "recomendacion": "texto de la recomendación",
  "tono": "positivo" | "ajuste_leve" | "atencion"
}`

export async function generateRecommendation(userPrompt: string, apiKey: string): Promise<RecommendationResult> {
  if (!apiKey) {
    throw new Error("Falta la API Key de Gemini.")
  }

  const res = await fetch(`${ENDPOINT}?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            recomendacion: { type: "string" },
            tono: { type: "string", enum: ["positivo", "ajuste_leve", "atencion"] },
          },
          required: ["recomendacion", "tono"],
        },
        temperature: 0.4,
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

  try {
    return JSON.parse(text) as RecommendationResult
  } catch {
    throw new Error("No se pudo interpretar la respuesta de la IA.")
  }
}