"use client"

import { createContext, useContext, useEffect, useState } from "react"
import supabase from "@/lib/supabaseClient"
import { migrateLocalToRemote } from "@/lib/supabaseSync"
import { loadStoredProfile, loadLogs, loadDeficits, clearLocalData } from "@/lib/storage"
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
  const [isGuest, setIsGuest] = useState(() => typeof window !== "undefined" && localStorage.getItem("nutrapp:guest") === "1")
  const [ready, setReady] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setReady(true)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      const u = session?.user ?? null
      setUser(u)
      if (!u) return
      setIsGuest(false)
      // Migrate local (guest) data to remote only once per user and only on sign-in.
      // Deferred outside the callback: awaiting supabase calls inside onAuthStateChange can deadlock.
      if (event === "SIGNED_IN" && localStorage.getItem(`nutrapp:migrated:${u.id}`) !== "1") {
        setTimeout(() => {
          const local = { profile: loadStoredProfile() ?? undefined, logs: loadLogs(), deficits: loadDeficits() }
          void migrateLocalToRemote(u.id, local).then((ok) => {
            if (ok) localStorage.setItem(`nutrapp:migrated:${u.id}`, "1")
          })
        }, 0)
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
      // Remove this user's data so another account on the same browser never sees or migrates it.
      clearLocalData()
      if (typeof window !== "undefined") window.location.replace("/")
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
