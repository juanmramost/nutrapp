"use client"

import { createContext, useContext, useEffect, useState } from "react"
import supabase from "@/lib/supabaseClient"
import { migrateLocalToRemote } from "@/lib/supabaseSync"
import { loadProfile, loadLogs } from "@/lib/storage"
import { User } from "@supabase/supabase-js"

type AuthContextValue = {
  user: User | null
  isGuest: boolean
  ready: boolean
  continueAsGuest: () => void
  clearGuest: () => void
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isGuest, setIsGuest] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // check guest flag
    const guest = typeof window !== "undefined" && localStorage.getItem("nutrapp:guest") === "1"
    setIsGuest(Boolean(guest))

    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setReady(true)
    })

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const u = session?.user ?? null
      setUser(u)
      if (u) {
        setIsGuest(false)
        // attempt to migrate local data to remote if present
        try {
          const local = { profile: loadProfile(), logs: loadLogs() }
          await migrateLocalToRemote(u.id, local)
          // mark migrated for this user
          if (typeof window !== "undefined") localStorage.setItem(`nutrapp:migrated:${u.id}`, "1")
        } catch {
          /* ignore migration errors */
        }
      }
    })

    return () => sub.subscription.unsubscribe()
  }, [])

  function continueAsGuest() {
    if (typeof window !== "undefined") {
      localStorage.setItem("nutrapp:guest", "1")
    }
    setIsGuest(true)
  }

  function clearGuest() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("nutrapp:guest")
      localStorage.removeItem("nutrapp:seenAuthGate")
    }
    setIsGuest(false)
  }

  async function signOut() {
    try {
      await supabase.auth.signOut()
    } finally {
      clearGuest()
      setUser(null)
      if (typeof window !== "undefined") window.location.reload()
    }
  }

  const value: AuthContextValue = { user, isGuest, ready, continueAsGuest, clearGuest, signOut }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider")
  return ctx
}
