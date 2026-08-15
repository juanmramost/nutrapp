import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
)

export default supabaseAdmin

export async function createSignedUrl(path: string, expires = 60) {
  const { data, error } = await supabaseAdmin.storage.from("uploads").createSignedUrl(path, expires)
  if (error) throw error
  return data.signedUrl
}

export async function downloadFileAsBase64(path: string) {
  const { data, error } = await supabaseAdmin.storage.from("uploads").download(path)
  if (error) throw error
  const arrayBuffer = await data.arrayBuffer()
  const base64 = Buffer.from(arrayBuffer).toString("base64")
  // try to infer mimeType from filename
  const ext = path.split(".").pop() || "jpg"
  const mimeType = ext === "png" ? "image/png" : "image/jpeg"
  return { mimeType, data: base64 }
}
