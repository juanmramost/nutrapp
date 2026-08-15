"use client"
import { useState } from "react"
import supabase from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

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
      setMessage(err.message || "Error al iniciar sesión con Google")
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

            <Button variant="secondary" onClick={handleGoogle} className="w-full">
              Continuar con Google
            </Button>
          </div>
        </form>

        {message && <p className="mt-4 text-sm">{message}</p>}
      </div>
    </div>
  )
}
