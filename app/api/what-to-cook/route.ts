import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { generateWhatToCook } from "@/lib/geminiWhatToCook"

const MAX_INGREDIENTS_LENGTH = 500

function error(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

interface RemainingMacrosInput {
  kcal?: number
  proteinas_g?: number
  carbohidratos_g?: number
  grasas_g?: number
}

function sanitizeRemaining(input: unknown): Required<RemainingMacrosInput> {
  const r = (input ?? {}) as RemainingMacrosInput
  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? Math.round(v) : 0)
  return {
    kcal: num(r.kcal),
    proteinas_g: num(r.proteinas_g),
    carbohidratos_g: num(r.carbohidratos_g),
    grasas_g: num(r.grasas_g),
  }
}

export async function POST(req: Request) {
  try {
    const authorization = req.headers.get("authorization")
    const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : null
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!token || !supabaseUrl || !supabaseAnonKey) return error("Authentication required", 401)

    const authClient = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } })
    const { data: authData, error: authError } = await authClient.auth.getUser(token)
    if (authError || !authData.user) return error("Authentication required", 401)

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return error("Server API key not configured", 500)

    const body = await req.json()
    const { ingredients, remaining, objetivo } = body as {
      ingredients?: unknown
      remaining?: unknown
      objetivo?: unknown
    }

    if (typeof ingredients !== "string" || ingredients.trim().length === 0 || ingredients.length > MAX_INGREDIENTS_LENGTH) {
      return error("Invalid ingredients", 400)
    }

    const remainingMacros = sanitizeRemaining(remaining)
    const objetivoText = typeof objetivo === "string" && objetivo.trim() ? objetivo.trim() : "mantener"

    const userContext = `Objetivo del usuario: ${objetivoText}

Le queda por consumir hoy aproximadamente:
- Calorías: ${remainingMacros.kcal} kcal
- Proteínas: ${remainingMacros.proteinas_g}g
- Carbohidratos: ${remainingMacros.carbohidratos_g}g
- Grasas: ${remainingMacros.grasas_g}g

Ingredientes que el usuario dice tener disponibles: "${ingredients.trim()}"

Propón 3 recetas distintas según las reglas indicadas.`

    const recipes = await generateWhatToCook(userContext, apiKey)
    return NextResponse.json({ recipes })
  } catch (caught) {
    console.error("what-to-cook failed", caught)
    return error("No se pudieron generar recetas. Inténtalo de nuevo en unos segundos.", 503)
  }
}