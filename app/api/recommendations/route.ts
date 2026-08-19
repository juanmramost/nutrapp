import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { generateRecommendation } from "@/lib/geminiRecommendation"

function error(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

function dateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

function lastNDateKeys(n: number): string[] {
  const keys: string[] = []
  const now = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    keys.push(dateKey(d))
  }
  return keys
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

type Entry = {
  id: string
  plato?: string
  calorias?: number
  proteinas_g?: number
  carbohidratos_g?: number
  grasas_g?: number
  tipo_actividad?: string
  calorias_activas?: number
}

function isMealEntry(e: Entry) {
  return typeof e.plato === "string"
}

function summarizeDay(entries: Entry[], deficit: number | undefined, dateLabel: string) {
  let kcal = 0
  let p = 0
  let c = 0
  let g = 0
  let kcalActivas = 0
  const actividades: string[] = []

  for (const e of entries) {
    if (isMealEntry(e)) {
      kcal += e.calorias ?? 0
      p += e.proteinas_g ?? 0
      c += e.carbohidratos_g ?? 0
      g += e.grasas_g ?? 0
    } else {
      kcalActivas += e.calorias_activas ?? 0
      if (e.tipo_actividad) actividades.push(e.tipo_actividad)
    }
  }

  const actividadTexto = actividades.length > 0 ? actividades.join(", ") : "ninguno"
  const deficitTexto = typeof deficit === "number" ? `${deficit} kcal` : "sin datos"

  return `${dateLabel}:
- Calorías consumidas: ${kcal} kcal
- Proteínas: ${p}g | Carbohidratos: ${c}g | Grasas: ${g}g
- Ejercicio: ${actividadTexto}, ${kcalActivas} kcal quemadas
- Déficit del día: ${deficitTexto}`
}

export async function GET(req: Request) {
  try {
    const user = await getAuthedUser(req)
    if (!user) return error("Authentication required", 401)

    const admin = getAdminClient()
    const today = dateKey(new Date())

    const { data, error: dbError } = await admin
      .from("recommendations")
      .select("texto, tono, fecha")
      .eq("user_id", user.id)
      .eq("fecha", today)
      .maybeSingle()

    if (dbError) throw dbError

    return NextResponse.json({ recommendation: data ?? null })
  } catch (caught) {
    console.error("recommendations GET failed", caught)
    return error("No se pudo cargar la recomendación.", 503)
  }
}

export async function POST(req: Request) {
  try {
    const user = await getAuthedUser(req)
    if (!user) return error("Authentication required", 401)

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return error("Server API key not configured", 500)

    const admin = getAdminClient()
    const today = dateKey(new Date())

    // 1. Si ya existe recomendación de hoy, devolverla sin llamar a Gemini
    const { data: existing, error: existingError } = await admin
      .from("recommendations")
      .select("texto, tono, fecha")
      .eq("user_id", user.id)
      .eq("fecha", today)
      .maybeSingle()

    if (existingError) throw existingError
    if (existing) return NextResponse.json({ recommendation: existing })

    // 2. Leer perfil, logs y deficits del usuario (nunca de otro, filtrado por user.id)
    const [{ data: profileRow }, { data: logsRow }, { data: deficitsRow }] = await Promise.all([
      admin.from("profiles").select("data").eq("user_id", user.id).maybeSingle(),
      admin.from("logs").select("data").eq("user_id", user.id).maybeSingle(),
      admin.from("deficits").select("data").eq("user_id", user.id).maybeSingle(),
    ])

    const profile = (profileRow?.data ?? {}) as {
      objetivo?: string
      imc?: number
      peso_kg?: number
      altura_cm?: number
    }
    const logs = (logsRow?.data ?? {}) as Record<string, Entry[]>
    const deficits = (deficitsRow?.data ?? {}) as Record<string, number>

    const keys = lastNDateKeys(3)
    const labels = ["Día -2", "Día -1", "Hoy"]

    const dayBlocks = keys.map((k, i) => summarizeDay(logs[k] ?? [], deficits[k], `${labels[i]} (${k})`))

    const objetivo = profile.objetivo ?? "mantener"
    let imc: number | null = null
    if (typeof profile.imc === "number" && Number.isFinite(profile.imc) && profile.imc > 0) {
      imc = Math.round(profile.imc * 10) / 10
    } else if (profile.peso_kg && profile.altura_cm) {
      const alturaM = profile.altura_cm / 100
      imc = Math.round((profile.peso_kg / (alturaM * alturaM)) * 10) / 10
    }
    const imcCategoria =
      imc === null
        ? "sin datos"
        : imc < 18.5
          ? "Bajo peso"
          : imc < 25
            ? "Normal"
            : imc < 30
              ? "Sobrepeso"
              : "Obesidad"

    const userPrompt = `Objetivo del usuario: ${objetivo}
Peso actual: ${profile.peso_kg ?? "sin datos"} kg
IMC: ${imc ?? "sin datos"} (${imcCategoria})

${dayBlocks.join("\n\n")}

Analiza estos 3 días según las reglas indicadas y dame la recomendación de hoy.`

    const result = await generateRecommendation(userPrompt, apiKey)

    const { data: saved, error: saveError } = await admin
      .from("recommendations")
      .upsert({ user_id: user.id, fecha: today, texto: result.recomendacion, tono: result.tono })
      .select("texto, tono, fecha")
      .single()

    if (saveError) throw saveError

    return NextResponse.json({ recommendation: saved })
  } catch (caught) {
    console.error("recommendations POST failed", caught)
    return error("No se pudo generar la recomendación. Inténtalo de nuevo en unos segundos.", 503)
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getAuthedUser(req)
    if (!user) return error("Authentication required", 401)

    const admin = getAdminClient()
    const today = dateKey(new Date())

    const { error: deleteError } = await admin
      .from("recommendations")
      .delete()
      .eq("user_id", user.id)
      .eq("fecha", today)

    if (deleteError) throw deleteError

    return NextResponse.json({ ok: true })
  } catch (caught) {
    console.error("recommendations DELETE failed", caught)
    return error("No se pudo invalidar la recomendación.", 503)
  }
}