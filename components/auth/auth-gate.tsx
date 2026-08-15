"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import supabase from "@/lib/supabaseClient"

export default function AuthGate() {
  const { user, isGuest, continueAsGuest, ready } = useAuth()
  const [show, setShow] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (!ready) return
    const seen = typeof window !== "undefined" && localStorage.getItem("nutrapp:seenAuthGate") === "1"
    if (!user && !isGuest && !seen) setShow(true)
  }, [user, isGuest, ready])

  if (!show) return null

  function handleGuest() {
    continueAsGuest()
    localStorage.setItem("nutrapp:seenAuthGate", "1")
    setShow(false)
  }

  function handleLogin() {
    localStorage.setItem("nutrapp:seenAuthGate", "1")
    router.push("/login")
  }

  async function handleGoogle() {
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider: "google" })
      if (error) throw error
    } catch (err: any) {
      const text = err?.message || String(err)
      // show a friendly alert and fallback to login page
      alert(
        text.includes("provider is not enabled") || text.includes("unsupported provider")
          ? "Google OAuth no está habilitado en Supabase. Habilítalo en Authentication → Providers."
          : text || "Error al iniciar con Google"
      )
      router.push("/login")
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-black/60 to-black/40">
      <div className="w-[94%] max-w-md rounded-2xl bg-gradient-to-b from-slate-900/80 to-slate-900/60 p-6 shadow-2xl ring-1 ring-white/6">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-deficit to-primary flex items-center justify-center text-white font-bold">D</div>
          <div>
            <h3 className="text-lg font-semibold">Bienvenido a Déficit</h3>
            <p className="mt-1 text-sm text-muted-foreground">Sincroniza tu historial y pruébalo en cualquier dispositivo.</p>
          </div>
        </div>

        <div className="mt-5 grid gap-3">
          <button onClick={handleLogin} className="w-full rounded-xl bg-deficit px-4 py-2 text-sm font-semibold text-white">Iniciar sesión / Registrarme</button>
          <button onClick={handleGoogle} className="w-full flex items-center justify-center gap-2 rounded-xl border bg-white/5 px-4 py-2 text-sm">
            <svg width="18" height="18" viewBox="0 0 533.5 544.3" aria-hidden>
              <path fill="#4285F4" d="M533.5 278.4c0-17.4-1.4-34.1-4.1-50.3H272v95.1h147.1c-6.3 34-25.7 62.8-54.7 82v68.1h88.4c51.7-47.6 81.7-118 81.7-194z"/>
              <path fill="#34A853" d="M272 544.3c73.7 0 135.6-24.4 180.8-66.3l-88.4-68.1c-24.6 16.5-56.1 26.2-92.4 26.2-71.1 0-131.4-48-153-112.4H28.1v70.6C73.2 499 165.6 544.3 272 544.3z"/>
              <path fill="#FBBC05" d="M119 323.6c-10.9-32.3-10.9-66.9 0-99.2V154H28.1c-39.8 77.6-39.8 170.4 0 248L119 323.6z"/>
              <path fill="#EA4335" d="M272 107.7c39 0 74.1 13.4 101.6 39.6l76.1-76.1C405.9 24.1 344 0 272 0 165.6 0 73.2 45.3 28.1 113.6l90.9 70.8C140.6 155.7 200.9 107.7 272 107.7z"/>
            </svg>
            Continuar con Google
          </button>
          <button onClick={handleGuest} className="w-full rounded-xl border px-4 py-2 text-sm">Continuar como invitado</button>
        </div>
      </div>
    </div>
  )
}
