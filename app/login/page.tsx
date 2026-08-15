"use client"
import { useState } from "react"
import supabase from "@/lib/supabaseClient"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      setMessage("Sesión iniciada. Recargando...")
      setTimeout(() => window.location.href = "/", 800)
    } catch (err: any) {
      setMessage(err.message || "Error al iniciar sesión")
    } finally {
      setLoading(false)
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    window.location.reload()
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={handleSignIn} className="w-full max-w-md p-6 bg-white/5 rounded">
        <h2 className="text-xl mb-4">Iniciar sesión</h2>
        <label className="block mb-2">
          <span>Email</span>
          <input value={email} onChange={e => setEmail(e.target.value)} type="email" className="mt-1 block w-full" />
        </label>
        <label className="block mb-4">
          <span>Contraseña</span>
          <input value={password} onChange={e => setPassword(e.target.value)} type="password" className="mt-1 block w-full" />
        </label>
        <div className="flex items-center gap-2">
          <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 rounded text-white">{loading ? 'Entrando...' : 'Entrar'}</button>
          <button type="button" onClick={handleSignOut} className="px-4 py-2 border rounded">Salir</button>
        </div>
        {message && <p className="mt-4">{message}</p>}
      </form>
    </div>
  )
}
