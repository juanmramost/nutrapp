"use client"

import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { TrackerProvider, useTracker } from "@/hooks/use-tracker"
import { BottomNav, type TabId } from "@/components/bottom-nav"
import { DashboardView } from "@/components/views/dashboard-view"
import { ScanFoodView } from "@/components/views/scan-food-view"
import { WorkoutView } from "@/components/views/workout-view"
import { ProfileView } from "@/components/views/profile-view"

function AppShell() {
  const { ready } = useTracker()
  const [tab, setTab] = useState<TabId>("dashboard")

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
      </div>
    )
  }

  return (
    <div className="mx-auto min-h-dvh max-w-md pb-20">
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {tab === "dashboard" && <DashboardView />}
          {tab === "scan" && <ScanFoodView onSaved={() => setTab("dashboard")} />}
          {tab === "workout" && <WorkoutView onSaved={() => setTab("dashboard")} />}
          {tab === "profile" && <ProfileView />}
        </motion.div>
      </AnimatePresence>

      <BottomNav active={tab} onChange={setTab} />
    </div>
  )
}

export default function Page() {
  return (
    <TrackerProvider>
      <AppShell />
    </TrackerProvider>
  )
}
