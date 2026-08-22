"use client"

import { useState, Component } from "react"
import { motion } from "motion/react"
import { TrackerProvider, useTracker } from "@/hooks/use-tracker"
import { AuthProvider } from "@/hooks/use-auth"
import AuthGate from "@/components/auth/auth-gate"
import { BottomNav, type TabId } from "@/components/bottom-nav"
import { DashboardView } from "@/components/views/dashboard-view"
import { ScanFoodView } from "@/components/views/scan-food-view"
import { WorkoutView } from "@/components/views/workout-view"
import { ProfileView } from "@/components/views/profile-view"
import { ProgresoView } from "@/components/views/progreso-view"
import { CocinaView } from "@/components/views/cocina-view"

function AppShell() {
  const { ready } = useTracker()
  const [tab, setTab] = useState<TabId>("dashboard")
  const [visitedTabs, setVisitedTabs] = useState<Set<TabId>>(
    () => new Set(["dashboard"]),
  )

  function handleTabChange(nextTab: TabId) {
    setTab(nextTab)

    setVisitedTabs((prev) => {
      if (prev.has(nextTab)) return prev

      const next = new Set(prev)
      next.add(nextTab)
      return next
    })
  }

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
      </div>
    )
  }

  return (
    <div className="mx-auto min-h-dvh max-w-md pb-20">
      <div className="relative">
        {visitedTabs.has("dashboard") && (
          <div className={tab === "dashboard" ? "block" : "hidden"}>
            <DashboardView />
          </div>
        )}

        {visitedTabs.has("scan") && (
          <div className={tab === "scan" ? "block" : "hidden"}>
            <ScanFoodView onSaved={() => handleTabChange("dashboard")} />
          </div>
        )}

        {visitedTabs.has("workout") && (
          <div className={tab === "workout" ? "block" : "hidden"}>
            <WorkoutView onSaved={() => handleTabChange("dashboard")} />
          </div>
        )}

        {visitedTabs.has("cocina") && (
          <div className={tab === "cocina" ? "block" : "hidden"}>
            <CocinaView />
          </div>
        )}

        {visitedTabs.has("profile") && (
          <div className={tab === "profile" ? "block" : "hidden"}>
            <ProfileView />
          </div>
        )}

        {visitedTabs.has("progreso") && (
          <div className={tab === "progreso" ? "block" : "hidden"}>
            <ProgresoView />
          </div>
        )}
      </div>

      <BottomNav active={tab} onChange={handleTabChange} />
    </div>
  )
}

export default function Page() {
  return (
    <AuthProvider>
      <TrackerProvider>
        <ErrorBoundary>
          <AppShell />
        </ErrorBoundary>
        <AuthGate />
      </TrackerProvider>
    </AuthProvider>
  )
}

type ErrorBoundaryProps = {
  children: React.ReactNode
}

type ErrorBoundaryState = {
  hasError: boolean
}

class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error) {
    console.error("App caught error:", error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-dvh flex-col items-center justify-center px-4 text-center">
          <div className="mb-4">
            ❗ Ocurrió un error al cargar la aplicación.
          </div>

          <button
            className="rounded bg-white px-4 py-2 text-black"
            onClick={() => {
              window.location.reload()
            }}
          >
            Recargar
          </button>
        </div>
      )
    }

    return this.props.children
  }
}