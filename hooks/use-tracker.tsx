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
import { getProfile, getLogs, getDeficits, upsertProfile, upsertLogs, upsertDeficits } from "@/lib/supabaseSync"
import supabase from "@/lib/supabaseClient"
import { loadDeficits, saveDeficits } from "@/lib/storage"
import { useAuth } from "@/hooks/use-auth"
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

  // When a user logs in, try to load remote data and apply locally
  const { user } = useAuth()
  const isApplyingRemoteRef = useRef(false)

  useEffect(() => {
    async function loadRemote() {
      if (!user) return
      try {
        const [remoteProfile, remoteLogs, remoteDeficits] = await Promise.all([
          getProfile(user.id),
          getLogs(user.id),
          getDeficits(user.id),
        ])
        // apply remote data but avoid echoing back to remote while applying
        isApplyingRemoteRef.current = true
        if (remoteProfile) {
          setProfileState(remoteProfile)
          try { saveProfile(remoteProfile) } catch {}
        }
        if (remoteLogs) {
          setLogs(remoteLogs)
          try { saveLogs(remoteLogs) } catch {}
        }
        if (remoteDeficits) {
          try { saveDeficits(remoteDeficits) } catch {}
        }
        isApplyingRemoteRef.current = false
      } catch {
        /* ignore remote load errors */
      }
    }
    loadRemote()
  }, [user])

  // Subscribe to remote changes for real-time sync (supabase-js v2 channels)
  useEffect(() => {
    if (!user) return

    const profileChannel = supabase
      .channel(`profiles-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles", filter: `user_id=eq.${user.id}` },
        async () => {
          try {
            isApplyingRemoteRef.current = true
            const remote = await getProfile(user.id)
            if (remote) {
              setProfileState(remote)
              try { saveProfile(remote) } catch {}
            }
          } finally {
            isApplyingRemoteRef.current = false
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
          try {
            isApplyingRemoteRef.current = true
            const remote = await getLogs(user.id)
            if (remote) {
              setLogs(remote)
              try { saveLogs(remote) } catch {}
            }
          } finally {
            isApplyingRemoteRef.current = false
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
          try {
            isApplyingRemoteRef.current = true
            const remote = await getDeficits(user.id)
            if (remote) {
              try { saveDeficits(remote) } catch {}
            }
          } finally {
            isApplyingRemoteRef.current = false
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
    // push to remote if logged in and not applying remote changes
    try {
      if (user && !isApplyingRemoteRef.current) {
        void upsertProfile(user.id, p)
      }
    } catch {}
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
        // push logs & deficits to remote
        try {
          if (user && !isApplyingRemoteRef.current) {
            void upsertLogs(user.id, next)
            void upsertDeficits(user.id, loadDeficits())
          }
        } catch {}
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
        try {
          if (user && !isApplyingRemoteRef.current) {
            void upsertLogs(user.id, next)
            void upsertDeficits(user.id, loadDeficits())
          }
        } catch {}
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
        try {
          if (user && !isApplyingRemoteRef.current) {
            void upsertLogs(user.id, next)
            void upsertDeficits(user.id, loadDeficits())
          }
        } catch {}
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
