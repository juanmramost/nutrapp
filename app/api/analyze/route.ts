import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { analyzeFood, analyzeWorkout } from "@/lib/gemini"
import { downloadFileAsBase64 } from "@/lib/supabaseAdmin"

const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const MAX_DETAILS_LENGTH = 1_000
const MAX_REQUESTS_PER_MINUTE = 10
const RETRY_DELAYS_MS = [300, 900]
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"])
const requestCounts = new Map<string, { count: number; resetAt: number }>()

type ImagePart = { mimeType: string; data: string }

function error(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

function takeRateLimit(userId: string) {
  const now = Date.now()
  const current = requestCounts.get(userId)
  if (!current || current.resetAt <= now) {
    requestCounts.set(userId, { count: 1, resetAt: now + 60_000 })
    return true
  }
  if (current.count >= MAX_REQUESTS_PER_MINUTE) return false
  current.count += 1
  return true
}

function parseImage(image: unknown): ImagePart | null {
  if (!image || typeof image !== "object") return null
  const { mimeType, data } = image as Partial<ImagePart>
  if (typeof mimeType !== "string" || !ALLOWED_MIME_TYPES.has(mimeType)) return null
  if (typeof data !== "string" || data.length === 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(data)) return null
  if (Buffer.byteLength(data, "base64") > MAX_IMAGE_BYTES) return null
  return { mimeType, data }
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isRetryable(error: unknown) {
  if (error instanceof TypeError) return true
  if (error && typeof error === "object") {
    const status = Number((error as { status?: number; statusCode?: number }).status ?? (error as { statusCode?: number }).statusCode)
    if ([408, 429, 500, 502, 503, 504].includes(status)) return true
  }
  return error instanceof Error && /Error de Gemini \((429|500|502|503|504)\)/.test(error.message)
}

async function retry<T>(operation: "storage" | "gemini", fn: () => Promise<T>): Promise<T> {
  let lastError: unknown
  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      const canRetry = operation === "storage" || isRetryable(error)
      if (!canRetry || attempt === RETRY_DELAYS_MS.length) break
      console.warn("analyze retry", { operation, attempt: attempt + 1, message: error instanceof Error ? error.message : String(error) })
      await wait(RETRY_DELAYS_MS[attempt])
    }
  }
  throw lastError
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
    if (!takeRateLimit(authData.user.id)) return error("Too many analysis requests. Try again in a minute.", 429)

    const body = await req.json()
    const { mode, image, imagePath, details } = body as {
      mode?: string
      image?: unknown
      imagePath?: unknown
      details?: unknown
    }
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return error("Server API key not configured", 500)
    }

    if ((mode !== "food" && mode !== "workout") || (imagePath && mode !== "food")) return error("Invalid request", 400)
    if (typeof details !== "undefined" && (typeof details !== "string" || details.length > MAX_DETAILS_LENGTH)) return error("Invalid request", 400)
    const analysisDetails = typeof details === "string" ? details : undefined

    if (mode === "food") {
      let imgPart = parseImage(image)
      if (!imgPart && typeof imagePath === "string") {
        const expectedPrefix = `uploads/${authData.user.id}/`
        if (
          !imagePath.startsWith(expectedPrefix) ||
          imagePath.includes("..") ||
          imagePath.length > 300 ||
          !/\.(jpe?g|png|webp)$/i.test(imagePath)
        ) {
          return error("Invalid image path", 400)
        }
        imgPart = await retry("storage", () => downloadFileAsBase64(imagePath))
      }
      if (!imgPart) return error("Invalid image", 400)
      const result = await retry("gemini", () => analyzeFood(imgPart, apiKey, analysisDetails))
      return NextResponse.json(result)
    }

    if (mode === "workout") {
      const imgPart = parseImage(image)
      if (!imgPart) return error("Invalid image", 400)
      const result = await retry("gemini", () => analyzeWorkout(imgPart, apiKey))
      return NextResponse.json(result)
    }

    return error("Invalid request", 400)
  } catch (caught) {
    console.error("analyze failed", { message: caught instanceof Error ? caught.message : String(caught) })
    return error("El análisis no está disponible temporalmente. Inténtalo de nuevo en unos segundos.", 503)
  }
}
