import supabase from "./supabaseClient"
import type { DailyLogs, UserProfile } from "./types"

export async function getProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase.from("profiles").select("data").eq("user_id", userId).single()
  if (error) return null
  return (data?.data as UserProfile) ?? null
}

export async function upsertProfile(userId: string, profile: UserProfile) {
  await supabase.from("profiles").upsert({ user_id: userId, data: profile })
}

export async function getLogs(userId: string): Promise<DailyLogs | null> {
  const { data, error } = await supabase.from("logs").select("data").eq("user_id", userId).single()
  if (error) return null
  return (data?.data as DailyLogs) ?? null
}

export async function upsertLogs(userId: string, logs: DailyLogs) {
  await supabase.from("logs").upsert({ user_id: userId, data: logs })
}

export async function getDeficits(userId: string): Promise<Record<string, number> | null> {
  const { data, error } = await supabase.from("deficits").select("data").eq("user_id", userId).single()
  if (error) return null
  return (data?.data as Record<string, number>) ?? null
}

export async function upsertDeficits(userId: string, deficits: Record<string, number>) {
  await supabase.from("deficits").upsert({ user_id: userId, data: deficits })
}

// Migrate local storage data to Supabase if remote is empty. Returns true if migrated or nothing to do.
export async function migrateLocalToRemote(userId: string, local: { profile?: UserProfile; logs?: DailyLogs; deficits?: Record<string, number> }) {
  try {
    const [remoteProfile, remoteLogs, remoteDeficits] = await Promise.all([getProfile(userId), getLogs(userId), getDeficits(userId)])

    if (!remoteProfile && local.profile) await upsertProfile(userId, local.profile)
    if ((!remoteLogs || Object.keys(remoteLogs).length === 0) && local.logs && Object.keys(local.logs).length > 0) await upsertLogs(userId, local.logs)
    if ((!remoteDeficits || Object.keys(remoteDeficits).length === 0) && local.deficits && Object.keys(local.deficits).length > 0) await upsertDeficits(userId, local.deficits)

    return true
  } catch {
    return false
  }
}
