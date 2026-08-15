import { NextResponse } from "next/server"
import { analyzeFood, analyzeWorkout } from "@/lib/gemini"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { mode, image, details } = body as { mode?: string; image?: any; details?: string }
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "Server API key not configured" }, { status: 500 })
    }

    if (!mode || !image) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }

    if (mode === "food") {
      const result = await analyzeFood(image, apiKey, details)
      return NextResponse.json(result)
    }

    if (mode === "workout") {
      const result = await analyzeWorkout(image, apiKey)
      return NextResponse.json(result)
    }

    return NextResponse.json({ error: "Unknown mode" }, { status: 400 })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
