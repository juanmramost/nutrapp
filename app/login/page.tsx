"use client"
import { useState } from "react"
import supabase from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import supabase from "@/lib/supabaseClient"

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [password2, setPassword2] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      setMessage("Sesión iniciada. Redirigiendo...")
      setTimeout(() => (window.location.href = "/"), 800)
    } catch (err: any) {
      setMessage(err.message || "Error al iniciar sesión")
    } finally {
      setLoading(false)
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)
    if (password !== password2) return setMessage("Las contraseñas no coinciden")
    setLoading(true)
    try {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) throw error
      setMessage("Cuenta creada. Revisa tu correo para confirmar (si aplica). Redirigiendo...")
      setTimeout(() => (window.location.href = "/"), 1200)
    } catch (err: any) {
      setMessage(err.message || "Error al registrarse")
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogle() {
    setMessage(null)
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider: "google" })
      if (error) throw error
      // OAuth will redirect away; nothing else to do here.
    } catch (err: any) {
      const text = err?.message || String(err)
      if (text.includes("provider is not enabled") || text.includes("unsupported provider")) {
        setMessage(
          "Google OAuth no está habilitado en Supabase. Habilítalo en Authentication → Providers y añade la URL de redirección de tu app."
        )
      } else {
        setMessage(text || "Error al iniciar sesión con Google")
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-xl bg-muted/10 p-6">
        <header className="mb-4">
          <h2 className="text-2xl font-bold">Déficit</h2>
          <p className="text-sm text-muted-foreground">Sincroniza tus datos o prueba como invitado</p>
        </header>

        <div className="mb-4 flex gap-2">
          <button
            onClick={() => setMode("login")}
            className={`flex-1 rounded-xl px-3 py-2 text-sm font-medium ${mode === "login" ? "bg-deficit text-white" : "bg-muted text-muted-foreground"}`}
          >
            Iniciar sesión
          </button>
          <button
            onClick={() => setMode("signup")}
            className={`flex-1 rounded-xl px-3 py-2 text-sm font-medium ${mode === "signup" ? "bg-deficit text-white" : "bg-muted text-muted-foreground"}`}
          >
            Registrarme
          </button>
        </div>

        <form onSubmit={mode === "login" ? handleSignIn : handleSignUp} className="space-y-3">
          <div>
            <Label>Email</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
          </div>

          <div>
            <Label>Contraseña</Label>
            <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" />
          </div>

          {mode === "signup" && (
            <div>
              <Label>Confirmar contraseña</Label>
              <Input value={password2} onChange={(e) => setPassword2(e.target.value)} type="password" />
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Button type="submit" disabled={loading} className="w-full">
              {mode === "login" ? (loading ? "Entrando..." : "Entrar") : (loading ? "Registrando..." : "Crear cuenta")}
            </Button>

            <button
              onClick={handleGoogle}
              className="flex items-center justify-center gap-2 rounded-xl border bg-white/5 px-3 py-2 text-sm"
              type="button"
            >
              <svg width="18" height="18" viewBox="0 0 533.5 544.3" aria-hidden>
                <path fill="#4285F4" d="M533.5 278.4c0-17.4-1.4-34.1-4.1-50.3H272v95.1h147.1c-6.3 34-25.7 62.8-54.7 82v68.1h88.4c51.7-47.6 81.7-118 81.7-194z"/>
                <path fill="#34A853" d="M272 544.3c73.7 0 135.6-24.4 180.8-66.3l-88.4-68.1c-24.6 16.5-56.1 26.2-92.4 26.2-71.1 0-131.4-48-153-112.4H28.1v70.6C73.2 499 165.6 544.3 272 544.3z"/>
                <path fill="#FBBC05" d="M119 323.6c-10.9-32.3-10.9-66.9 0-99.2V154H28.1c-39.8 77.6-39.8 170.4 0 248L119 323.6z"/>
                <path fill="#EA4335" d="M272 107.7c39 0 74.1 13.4 101.6 39.6l76.1-76.1C405.9 24.1 344 0 272 0 165.6 0 73.2 45.3 28.1 113.6l90.9 70.8C140.6 155.7 200.9 107.7 272 107.7z"/>
              </svg>
              <span>Continuar con Google</span>
            </button>

            <button
              onClick={() => { localStorage.setItem("nutrapp:guest", "1"); window.location.href = "/" }}
              className="rounded-xl border px-3 py-2 text-sm bg-transparent"
              type="button"
            >
              Continuar como invitado
            </button>
          </div>
        </form>

        {message && <p className="mt-4 text-sm">{message}</p>}
      </div>
    </div>
  )
}
