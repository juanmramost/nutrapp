"use client"

import { useState, Component } from "react"
import { AnimatePresence, motion } from "motion/react"
import { TrackerProvider, useTracker } from "@/hooks/use-tracker"
import { AuthProvider } from "@/hooks/use-auth"
import AuthGate from "@/components/auth/auth-gate"
import { BottomNav, type TabId } from "@/components/bottom-nav"
import { DashboardView } from "@/components/views/dashboard-view"
import { ScanFoodView } from "@/components/views/scan-food-view"
import { WorkoutView } from "@/components/views/workout-view"
import { ProfileView } from "@/components/views/profile-view"
import { ProgresoView } from "@/components/views/progreso-view"

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
          {tab === "progreso" && <ProgresoView />}
        </motion.div>
      </AnimatePresence>

      <BottomNav active={tab} onChange={setTab} />
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

type ErrorBoundaryProps = { children: React.ReactNode }
type ErrorBoundaryState = { hasError: boolean }

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
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
        <div className="min-h-dvh flex flex-col items-center justify-center px-4 text-center">
          <div className="mb-4">❗ Ocurrió un error al cargar la aplicación.</div>
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
