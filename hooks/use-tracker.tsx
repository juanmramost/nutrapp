"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import type { DailyLogs, LogEntry, UserProfile } from "@/lib/types"
import {
  DEFAULT_PROFILE,
  addEntry,
  dateKey,
  loadApiKey,
  loadLogs,
  loadProfile,
  removeEntry,
  saveApiKey,
  saveLogs,
  saveProfile,
  updateEntry,
  setDeficit,
  removeDeficit,
} from "@/lib/storage"
import { calcBasal, computeTotals, type DayTotals } from "@/lib/nutrition"

interface TrackerContextValue {
  ready: boolean
  profile: UserProfile
  apiKey: string
  todayKey: string
  todayEntries: LogEntry[]
  totals: DayTotals
  setProfile: (p: UserProfile) => void
  setApiKey: (k: string) => void
  addToday: (entry: LogEntry) => void
  removeToday: (id: string) => void
  removeDay: (dateKey: string) => void
  updateToday: (entry: LogEntry) => void
}

const TrackerContext = createContext<TrackerContextValue | null>(null)

export function TrackerProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false)
  const [profile, setProfileState] = useState<UserProfile>(DEFAULT_PROFILE)
  const [logs, setLogs] = useState<DailyLogs>({})
  const [apiKey, setApiKeyState] = useState("")
  const todayKey = useMemo(() => dateKey(), [])
  const bcRef = useRef<BroadcastChannel | null>(null)

  useEffect(() => {
    setProfileState(loadProfile())
    setLogs(loadLogs())
    setApiKeyState(loadApiKey())
    if (typeof BroadcastChannel !== "undefined") {
      try {
        bcRef.current = new BroadcastChannel("nutrapp-sync")
      } catch {
        bcRef.current = null
      }
    }
    setReady(true)
  }, [])

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
  }, [todayKey])

  const setApiKey = useCallback((k: string) => {
    setApiKeyState(k)
    saveApiKey(k)
  }, [])

  const todayEntries = useMemo(() => logs[todayKey] ?? [], [logs, todayKey])

  const basal = useMemo(
    () => (profile.auto_basal ? calcBasal(profile) : profile.tdee_basal),
    [profile],
  )

  const totals = useMemo(() => computeTotals(todayEntries, basal), [todayEntries, basal])

  const removeDay = useCallback(
    (dk: string) => {
      setLogs((prev) => {
        const next = { ...prev }
        if (next[dk]) delete next[dk]
        saveLogs(next)
        try {
          removeDeficit(dk)
        } catch {}
        return next
      })

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("deficits:changed", { detail: { key: dk } }))
        try {
          bcRef.current?.postMessage({ type: "sync", key: dk })
        } catch {}
        try {
          localStorage.setItem("nutrapp:sync", String(Date.now()))
        } catch {}
      }
    },
    [],
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
        return next
      })
    },
    [todayKey, basal],
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
        return next
      })
    },
    [todayKey, basal],
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
        return next
      })
    },
    [todayKey, basal],
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
    apiKey,
    todayKey,
    todayEntries,
    totals,
    setProfile,
    setApiKey,
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
