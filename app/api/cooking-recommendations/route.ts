import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { generateCookingRecommendations } from "@/lib/geminiCooking"
import type { CookingRecipe } from "@/lib/types"

const CYCLE_DAYS = 5
const CYCLE_MS = CYCLE_DAYS * 24 * 60 * 60 * 1000

function error(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

async function getAuthedUser(req: Request) {
  const authorization = req.headers.get("authorization")
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : null
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!token || !supabaseUrl || !supabaseAnonKey) return null

  const authClient = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } })
  const { data, error: authError } = await authClient.auth.getUser(token)
  if (authError || !data.user) return null
  return data.user
}

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) throw new Error("Supabase admin no configurado")
  return createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })
}

function isExpired(generatedAt: string): boolean {
  const generatedTime = new Date(generatedAt).getTime()
  return Date.now() - generatedTime > CYCLE_MS
}

export async function GET(req: Request) {
  try {
    const user = await getAuthedUser(req)
    if (!user) return error("Authentication required", 401)

    const admin = getAdminClient()
    const { data, error: dbError } = await admin
      .from("cooking_recommendations")
      .select("recipes, generated_at")
      .eq("user_id", user.id)
      .maybeSingle()

    if (dbError) throw dbError
    if (!data) return NextResponse.json({ recommendations: null })

    return NextResponse.json({
      recommendations: {
        recipes: data.recipes as CookingRecipe[],
        generated_at: data.generated_at,
        expired: isExpired(data.generated_at),
      },
    })
  } catch (caught) {
    console.error("cooking-recommendations GET failed", caught)
    return error("No se pudieron cargar las recomendaciones.", 503)
  }
}

export async function POST(req: Request) {
  try {
    const user = await getAuthedUser(req)
    if (!user) return error("Authentication required", 401)

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return error("Server API key not configured", 500)

    const admin = getAdminClient()

    // Si ya existe un ciclo vigente (menos de 5 días), devolverlo sin llamar a Gemini
    const { data: existing, error: existingError } = await admin
      .from("cooking_recommendations")
      .select("recipes, generated_at")
      .eq("user_id", user.id)
      .maybeSingle()

    if (existingError) throw existingError
    if (existing && !isExpired(existing.generated_at)) {
      return NextResponse.json({
        recommendations: { recipes: existing.recipes as CookingRecipe[], generated_at: existing.generated_at, expired: false },
      })
    }

    // Leer perfil para personalizar (objetivo, peso) sin crear un sistema nuevo de cálculo
    const { data: profileRow } = await admin.from("profiles").select("data").eq("user_id", user.id).maybeSingle()
    const profile = (profileRow?.data ?? {}) as { objetivo?: string; peso_kg?: number; altura_cm?: number }

    const userContext = `Genera un ciclo nuevo de 24 recetas (6 desayuno, 6 almuerzo, 6 postre, 6 cena) para un usuario con:
- Objetivo: ${profile.objetivo ?? "mantener"}
- Peso: ${profile.peso_kg ?? "no especificado"} kg

Prioriza: saludabilidad, luego proteína, luego calorías moderadas, luego carbohidratos y grasas equilibrados. Los postres no necesitan ser altos en proteína pero deben ser opciones razonables.`

    let recipes: CookingRecipe[]
    try {
      recipes = await generateCookingRecommendations(userContext, apiKey)
    } catch (genError) {
      // Si falla la generación y ya había un ciclo anterior (aunque expirado), lo mantenemos
      // en vez de dejar al usuario sin nada.
      if (existing) {
        return NextResponse.json({
          recommendations: { recipes: existing.recipes as CookingRecipe[], generated_at: existing.generated_at, expired: true },
          warning: "No se pudo generar un nuevo ciclo. Mostrando el anterior.",
        })
      }
      throw genError
    }

    const generatedAt = new Date().toISOString()
    const { error: saveError } = await admin
      .from("cooking_recommendations")
      .upsert({ user_id: user.id, recipes, generated_at: generatedAt })

    if (saveError) throw saveError

    return NextResponse.json({ recommendations: { recipes, generated_at: generatedAt, expired: false } })
  } catch (caught) {
    console.error("cooking-recommendations POST failed", caught)
    return error("No se pudieron generar las recomendaciones. Inténtalo de nuevo en unos segundos.", 503)
  }
}