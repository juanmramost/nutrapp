"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-[94%] max-w-md rounded-xl bg-background p-6 shadow-lg">
        <h3 className="text-lg font-semibold">Bienvenido a Déficit</h3>
        <p className="mt-2 text-sm text-muted-foreground">Inicia sesión para sincronizar tus datos entre dispositivos, o continúa como invitado.</p>
        <div className="mt-4 flex gap-2">
          <button onClick={handleLogin} className="flex-1 rounded-xl bg-deficit px-4 py-2 text-white">Iniciar sesión / Registrarme</button>
          <button onClick={handleGuest} className="flex-1 rounded-xl border px-4 py-2">Continuar como invitado</button>
        </div>
      </div>
    </div>
  )
}
