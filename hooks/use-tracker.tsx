"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import type { DailyLogs, LogEntry, UserProfile } from "@/lib/types"
import {
  addEntry,
  dateKey,
  loadLogs,
  loadProfile,
  removeEntry,
  saveLogs,
  saveProfile,
  updateEntry,
  setDeficit,
  removeDeficit,
  mergeLogs,
} from "@/lib/storage"
import { getProfile, getLogs, getDeficits, upsertProfile, upsertLogs, upsertDeficits } from "@/lib/supabaseSync"
import supabase from "@/lib/supabaseClient"
import { loadDeficits, saveDeficits } from "@/lib/storage"
import { useAuth } from "@/hooks/use-auth"
import { calcBasal, computeTotals, type DayTotals } from "@/lib/nutrition"

interface TrackerContextValue {
  ready: boolean
  profile: UserProfile
  todayKey: string
  todayEntries: LogEntry[]
  totals: DayTotals
  /** true si la última escritura remota falló (los datos siguen guardados en local) */
  syncError: boolean
  setProfile: (p: UserProfile) => void
  addToday: (entry: LogEntry) => void
  removeToday: (id: string) => void
  removeDay: (dateKey: string) => void
  updateToday: (entry: LogEntry) => void
}

const TrackerContext = createContext<TrackerContextValue | null>(null)

export function TrackerProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false)
  const [profile, setProfileState] = useState<UserProfile>(() => loadProfile())
  const [logs, setLogs] = useState<DailyLogs>(() => loadLogs())
  const [todayKey, setTodayKey] = useState(() => dateKey())
  const [syncError, setSyncError] = useState(false)
  const bcRef = useRef<BroadcastChannel | null>(null)

  const trackSync = useCallback((...ops: Promise<boolean>[]) => {
    void Promise.all(ops).then((results) => setSyncError(results.some((ok) => !ok)))
  }, [])

  // Keep todayKey current when the app stays open past midnight
  useEffect(() => {
    const id = window.setInterval(() => {
      setTodayKey((prev) => {
        const next = dateKey()
        return next === prev ? prev : next
      })
    }, 60_000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    if (typeof BroadcastChannel !== "undefined") {
      try {
        bcRef.current = new BroadcastChannel("nutrapp-sync")
      } catch {
        bcRef.current = null
      }
    }
    const readyFrame = window.requestAnimationFrame(() => setReady(true))
    return () => window.cancelAnimationFrame(readyFrame)
  }, [])

  // When a user logs in, load remote data and merge it with any local entries
  const { user } = useAuth()

  useEffect(() => {
    async function loadRemote() {
      if (!user) return
      try {
        const [remoteProfile, remoteLogs, remoteDeficits] = await Promise.all([
          getProfile(user.id),
          getLogs(user.id),
          getDeficits(user.id),
        ])
        if (remoteProfile) {
          setProfileState(remoteProfile)
          try { saveProfile(remoteProfile) } catch {}
        }
        // Merge instead of replacing so entries created locally (e.g. while offline
        // or before a failed upsert) are never silently discarded
        const merged = mergeLogs(remoteLogs ?? {}, loadLogs())
        setLogs(merged)
        try { saveLogs(merged) } catch {}
        if (remoteDeficits) {
          try { saveDeficits({ ...loadDeficits(), ...remoteDeficits }) } catch {}
        }
        // Recompute deficits for merged days and notify views
        try {
          const p = remoteProfile ?? loadProfile()
          const basalNow = p.auto_basal ? calcBasal(p) : p.tdee_basal
          for (const k of Object.keys(merged)) {
            setDeficit(k, computeTotals(merged[k] ?? [], basalNow).deficitNeto)
          }
          window.dispatchEvent(new CustomEvent("deficits:changed"))
        } catch {}
        // Push local-only entries back to remote
        if (JSON.stringify(merged) !== JSON.stringify(remoteLogs ?? {})) {
          trackSync(upsertLogs(user.id, merged), upsertDeficits(user.id, loadDeficits()))
        }
      } catch {
        /* ignore remote load errors */
      }
    }
    loadRemote()
  }, [user, trackSync])

  // Subscribe to remote changes for real-time sync (supabase-js v2 channels)
  useEffect(() => {
    if (!user) return

    const profileChannel = supabase
      .channel(`profiles-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles", filter: `user_id=eq.${user.id}` },
        async () => {
          const remote = await getProfile(user.id)
          if (remote) {
            setProfileState(remote)
            try { saveProfile(remote) } catch {}
          }
        },
      )
      .subscribe()

    const logsChannel = supabase
      .channel(`logs-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "logs", filter: `user_id=eq.${user.id}` },
        async () => {
          const remote = await getLogs(user.id)
          if (remote) {
            // Merge with local so a write racing with this event is not clobbered
            const merged = mergeLogs(remote, loadLogs())
            setLogs(merged)
            try { saveLogs(merged) } catch {}
          }
        },
      )
      .subscribe()

    const deficitsChannel = supabase
      .channel(`deficits-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "deficits", filter: `user_id=eq.${user.id}` },
        async () => {
          const remote = await getDeficits(user.id)
          if (remote) {
            try { saveDeficits(remote) } catch {}
            try { window.dispatchEvent(new CustomEvent("deficits:changed")) } catch {}
          }
        },
      )
      .subscribe()

    return () => {
      try { profileChannel.unsubscribe() } catch {}
      try { logsChannel.unsubscribe() } catch {}
      try { deficitsChannel.unsubscribe() } catch {}
    }
  }, [user])

  const setProfile = useCallback((p: UserProfile) => {
    setProfileState(p)
    saveProfile(p)
    // update today's deficit because basal may have changed
    try {
      const allLogs = loadLogs()
      const dayEntries = allLogs[todayKey] ?? []
      const basalNew = p.auto_basal ? calcBasal(p) : p.tdee_basal
      const totals = computeTotals(dayEntries, basalNew)
      setDeficit(todayKey, totals.deficitNeto)
    } catch {
      /* ignore errors */
    }
    // push to remote if logged in
    try {
      if (user) {
        trackSync(upsertProfile(user.id, p))
      }
    } catch {}
  }, [todayKey, user, trackSync])

  const todayEntries = useMemo(() => logs[todayKey] ?? [], [logs, todayKey])

  const basal = useMemo(
    () => (profile.auto_basal ? calcBasal(profile) : profile.tdee_basal),
    [profile],
  )

  const totals = useMemo(() => computeTotals(todayEntries, basal), [todayEntries, basal])

  const removeDay = useCallback(
    (dk: string) => {
      // remove from storage
      try {
        const current = loadLogs()
        if (current[dk]) delete current[dk]
        saveLogs(current)
      } catch {}
      try {
        removeDeficit(dk)
      } catch {}

      // force local state reload
      try {
        setLogs(loadLogs())
      } catch {}

      // push logs & deficits to remote if logged in
      try {
        if (user) {
          trackSync(upsertLogs(user.id, loadLogs()), upsertDeficits(user.id, loadDeficits()))
        }
      } catch {}

      // emit sync events for other contexts
      if (typeof window !== "undefined") {
        try {
          window.dispatchEvent(new CustomEvent("deficits:changed", { detail: { key: dk } }))
        } catch {}
        try {
          window.dispatchEvent(new CustomEvent("logs:changed", { detail: { key: dk } }))
        } catch {}
        try {
          bcRef.current?.postMessage({ type: "sync", key: dk })
        } catch {}
        try {
          localStorage.setItem("nutrapp:sync", String(Date.now()))
        } catch {}
      }
    },
    [user, trackSync],
  )

  const addToday = useCallback(
    (entry: LogEntry) => {
      setLogs((prev) => {
        const next = addEntry(prev, todayKey, entry)
        saveLogs(next)
        try {
          const dayEntries = next[todayKey] ?? []
          const totals = computeTotals(dayEntries, basal)
          setDeficit(todayKey, totals.deficitNeto)
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("deficits:changed", { detail: { key: todayKey } }))
            try {
              bcRef.current?.postMessage({ type: "sync", key: todayKey })
            } catch {}
            try {
              localStorage.setItem("nutrapp:sync", String(Date.now()))
            } catch {}
          }
        } catch {
          /* ignore */
        }
        // push logs & deficits to remote
        try {
          if (user) {
            trackSync(upsertLogs(user.id, next), upsertDeficits(user.id, loadDeficits()))
          }
        } catch {}
        return next
      })
    },
    [todayKey, basal, user, trackSync],
  )

  const removeToday = useCallback(
    (id: string) => {
      setLogs((prev) => {
        const next = removeEntry(prev, todayKey, id)
        saveLogs(next)
        try {
          const dayEntries = next[todayKey] ?? []
          const totals = computeTotals(dayEntries, basal)
          setDeficit(todayKey, totals.deficitNeto)
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("deficits:changed", { detail: { key: todayKey } }))
            try {
              bcRef.current?.postMessage({ type: "sync", key: todayKey })
            } catch {}
            try {
              localStorage.setItem("nutrapp:sync", String(Date.now()))
            } catch {}
          }
        } catch {
          /* ignore */
        }
        try {
          if (user) {
            trackSync(upsertLogs(user.id, next), upsertDeficits(user.id, loadDeficits()))
          }
        } catch {}
        return next
      })
    },
    [todayKey, basal, user, trackSync],
  )

  const updateToday = useCallback(
    (entry: LogEntry) => {
      setLogs((prev) => {
        const next = updateEntry(prev, todayKey, entry)
        saveLogs(next)
        try {
          const dayEntries = next[todayKey] ?? []
          const totals = computeTotals(dayEntries, basal)
          setDeficit(todayKey, totals.deficitNeto)
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("deficits:changed", { detail: { key: todayKey } }))
            try {
              bcRef.current?.postMessage({ type: "sync", key: todayKey })
            } catch {}
            try {
              localStorage.setItem("nutrapp:sync", String(Date.now()))
            } catch {}
          }
        } catch {
          /* ignore */
        }
        try {
          if (user) {
            trackSync(upsertLogs(user.id, next), upsertDeficits(user.id, loadDeficits()))
          }
        } catch {}
        return next
      })
    },
    [todayKey, basal, user, trackSync],
  )

  // Listen for external sync messages (BroadcastChannel or storage events)
  useEffect(() => {
    function doSync() {
      try {
        const externalLogs = loadLogs()
        setLogs(externalLogs)
        const externalProfile = loadProfile()
        setProfileState(externalProfile)
        const basalNow = externalProfile.auto_basal ? calcBasal(externalProfile) : externalProfile.tdee_basal
        for (const k of Object.keys(externalLogs)) {
          try {
            const totals = computeTotals(externalLogs[k] ?? [], basalNow)
            setDeficit(k, totals.deficitNeto)
          } catch {
            /* ignore per-day */
          }
        }
        if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("deficits:changed"))
      } catch {
        /* ignore */
      }
    }

    const bc = bcRef.current
    function bcHandler(ev: MessageEvent) {
      const msg = ev?.data
      if (msg && msg.type === "sync") doSync()
    }
    if (bc) bc.addEventListener("message", bcHandler)

    function storageHandler(ev: StorageEvent) {
      if (ev.key === "nutrapp:sync") doSync()
    }
    if (typeof window !== "undefined") window.addEventListener("storage", storageHandler)

    return () => {
      if (bc) bc.removeEventListener("message", bcHandler)
      if (typeof window !== "undefined") window.removeEventListener("storage", storageHandler)
    }
  }, [])


  const value: TrackerContextValue = {
    ready,
    profile,
    todayKey,
    todayEntries,
    totals,
    syncError,
    setProfile,
    addToday,
    removeToday,
    removeDay,
    updateToday,
  }

  return <TrackerContext.Provider value={value}>{children}</TrackerContext.Provider>
}

export function useTracker() {
  const ctx = useContext(TrackerContext)
  if (!ctx) throw new Error("useTracker debe usarse dentro de TrackerProvider")
  return ctx
}
