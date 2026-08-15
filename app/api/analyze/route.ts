import { NextResponse } from "next/server"
import { analyzeFood, analyzeWorkout } from "@/lib/gemini"
import { downloadFileAsBase64 } from "@/lib/supabaseAdmin"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { mode, image, imagePath, details } = body as { mode?: string; image?: any; imagePath?: string; details?: string }
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "Server API key not configured" }, { status: 500 })
    }

    if (!mode || (!image && !imagePath)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }

    if (mode === "food") {
      let imgPart = image
      if (!imgPart && imagePath) {
        // download from Supabase storage using admin key
        imgPart = await downloadFileAsBase64(imagePath)
      }
      const result = await analyzeFood(imgPart, apiKey, details)
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
