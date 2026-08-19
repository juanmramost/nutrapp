import type { DailyLogs, LogEntry, UserProfile } from "./types"

const PROFILE_KEY = "user_profile"
const LOGS_KEY = "daily_logs"
const API_KEY_KEY = "gemini_api_key"

export const DEFAULT_PROFILE: UserProfile = {
  peso_kg: 75,
  altura_cm: 175,
  edad: 30,
  genero: "hombre",
  objetivo: "mantener",
  tdee_basal: 1700,
  auto_basal: true,
}

function isBrowser() {
  return typeof window !== "undefined"
}

/** Formatea una fecha como clave YYYY-MM-DD en horario local. */
export function dateKey(date: Date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export function loadProfile(): UserProfile {
  if (!isBrowser()) return DEFAULT_PROFILE
  try {
    const raw = localStorage.getItem(PROFILE_KEY)
    if (!raw) return DEFAULT_PROFILE
    return { ...DEFAULT_PROFILE, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_PROFILE
  }
}

export function saveProfile(profile: UserProfile) {
  if (!isBrowser()) return
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
}

export function loadLogs(): DailyLogs {
  if (!isBrowser()) return {}
  try {
    const raw = localStorage.getItem(LOGS_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as DailyLogs
  } catch {
    return {}
  }
}

export function saveLogs(logs: DailyLogs) {
  if (!isBrowser()) return
  localStorage.setItem(LOGS_KEY, JSON.stringify(logs))
}

export function addEntry(logs: DailyLogs, key: string, entry: LogEntry): DailyLogs {
  const day = logs[key] ? [...logs[key]] : []
  day.push(entry)
  return { ...logs, [key]: day }
}

export function removeEntry(logs: DailyLogs, key: string, id: string): DailyLogs {
  if (!logs[key]) return logs
  return { ...logs, [key]: logs[key].filter((e) => e.id !== id) }
}

export function updateEntry(logs: DailyLogs, key: string, entry: LogEntry): DailyLogs {
  if (!logs[key]) return logs
  return { ...logs, [key]: logs[key].map((e) => (e.id === entry.id ? entry : e)) }
}

export function loadApiKey(): string {
  if (!isBrowser()) return ""
  return localStorage.getItem(API_KEY_KEY) || process.env.NEXT_PUBLIC_GEMINI_API_KEY || ""
}

export function saveApiKey(key: string) {
  if (!isBrowser()) return
  localStorage.setItem(API_KEY_KEY, key.trim())
}

const DEFICITS_KEY = "daily_deficits"

export function loadDeficits(): Record<string, number> {
  if (!isBrowser()) return {}
  try {
    const raw = localStorage.getItem(DEFICITS_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as Record<string, number>
  } catch {
    return {}
  }
}

export function saveDeficits(deficits: Record<string, number>) {
  if (!isBrowser()) return
  localStorage.setItem(DEFICITS_KEY, JSON.stringify(deficits))
}

export function setDeficit(dateKey: string, kcal: number) {
  if (!isBrowser()) return
  const rounded = Math.round(kcal)
  if (rounded === 0) {
    // treat zero as no record
    const d = loadDeficits()
    delete d[dateKey]
    saveDeficits(d)
    return
  }
  const next = { ...loadDeficits(), [dateKey]: rounded }
  saveDeficits(next)
}

export function removeDeficit(dateKey: string) {
  if (!isBrowser()) return
  const d = loadDeficits()
  delete d[dateKey]
  saveDeficits(d)
}

export function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}