"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import supabase from "@/lib/supabaseClient"
import GoogleIcon from "@/components/ui/icons/google-icon"

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
          <button onClick={handleGoogle} className="w-full flex items-center justify-center gap-2 rounded-xl border bg-white/5 px-4 py-2 text-sm hover:bg-white/10 active:scale-95 transition">
            <GoogleIcon />
            Continuar con Google
          </button>
          <button onClick={handleGuest} className="w-full rounded-xl border px-4 py-2 text-sm">Continuar como invitado</button>
        </div>
      </div>
    </div>
  )
}
