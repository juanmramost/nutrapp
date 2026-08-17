import { createClient, type SupabaseClient } from "@supabase/supabase-js"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Defer the missing-config error until first use so that builds and server
// rendering do not crash when the env vars are not set.
const missingConfig = new Proxy({} as SupabaseClient, {
  get() {
    throw new Error(
      'Missing Supabase config: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local and restart the dev server.'
    )
  },
})

const supabase = url && anonKey ? createClient(url, anonKey) : missingConfig

export default supabase
