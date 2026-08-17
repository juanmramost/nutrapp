import { createClient, type SupabaseClient } from "@supabase/supabase-js"

let cachedAdmin: SupabaseClient | null = null

function getSupabaseAdmin(): SupabaseClient {
  if (!cachedAdmin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !serviceRoleKey) {
      throw new Error(
        "Missing Supabase admin config: set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
      )
    }
    cachedAdmin = createClient(url, serviceRoleKey, { auth: { persistSession: false } })
  }
  return cachedAdmin
}

export async function createSignedUrl(path: string, expires = 60) {
  const { data, error } = await getSupabaseAdmin().storage.from("uploads").createSignedUrl(path, expires)
  if (error) throw error
  return data.signedUrl
}

const MIME_BY_EXT: Record<string, string> = {
  png: "image/png",
  webp: "image/webp",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
}

export async function downloadFileAsBase64(path: string) {
  const { data, error } = await getSupabaseAdmin().storage.from("uploads").download(path)
  if (error) throw error
  const arrayBuffer = await data.arrayBuffer()
  const base64 = Buffer.from(arrayBuffer).toString("base64")
  // try to infer mimeType from filename
  const ext = (path.split(".").pop() || "jpg").toLowerCase()
  const mimeType = MIME_BY_EXT[ext] ?? "image/jpeg"
  return { mimeType, data: base64 }
}
