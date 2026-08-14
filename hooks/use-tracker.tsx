"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
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
  updateToday: (entry: LogEntry) => void
}

const TrackerContext = createContext<TrackerContextValue | null>(null)

export function TrackerProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false)
  const [profile, setProfileState] = useState<UserProfile>(DEFAULT_PROFILE)
  const [logs, setLogs] = useState<DailyLogs>({})
  const [apiKey, setApiKeyState] = useState("")
  const todayKey = useMemo(() => dateKey(), [])

  useEffect(() => {
    setProfileState(loadProfile())
    setLogs(loadLogs())
    setApiKeyState(loadApiKey())
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

  const addToday = useCallback(
    (entry: LogEntry) => {
      setLogs((prev) => {
        const next = addEntry(prev, todayKey, entry)
        saveLogs(next)
        try {
          const dayEntries = next[todayKey] ?? []
          const totals = computeTotals(dayEntries, basal)
          setDeficit(todayKey, totals.deficitNeto)
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
        } catch {
          /* ignore */
        }
        return next
      })
    },
    [todayKey, basal],
  )

  const todayEntries = useMemo(() => logs[todayKey] ?? [], [logs, todayKey])

  const basal = useMemo(
    () => (profile.auto_basal ? calcBasal(profile) : profile.tdee_basal),
    [profile],
  )

  const totals = useMemo(() => computeTotals(todayEntries, basal), [todayEntries, basal])

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
    updateToday,
  }

  return <TrackerContext.Provider value={value}>{children}</TrackerContext.Provider>
}

export function useTracker() {
  const ctx = useContext(TrackerContext)
  if (!ctx) throw new Error("useTracker debe usarse dentro de TrackerProvider")
  return ctx
}
