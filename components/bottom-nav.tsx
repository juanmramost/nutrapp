"use client"

import { motion } from "motion/react"
import { Camera, ChefHat, Dumbbell, Home, Settings, BarChart } from "lucide-react"
import type { LucideIcon } from "lucide-react"

export type TabId = "dashboard" | "scan" | "workout" | "cocina" | "profile" | "progreso"

const TABS: { id: TabId; label: string; icon: LucideIcon }[] = [
  { id: "dashboard", label: "Hoy", icon: Home },
  { id: "scan", label: "Comida", icon: Camera },
  { id: "workout", label: "Entreno", icon: Dumbbell },
  { id: "cocina", label: "Cocina", icon: ChefHat },
  { id: "progreso", label: "Progreso", icon: BarChart },
  { id: "profile", label: "Perfil", icon: Settings },
]

export function BottomNav({ active, onChange }: { active: TabId; onChange: (id: TabId) => void }) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/80 backdrop-blur-xl"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Navegación principal"
    >
      <ul className="mx-auto flex max-w-md items-stretch">
        {TABS.map((tab) => {
          const isActive = active === tab.id
          const Icon = tab.icon
          return (
            <li key={tab.id} className="flex-1">
              <button
                type="button"
                onClick={() => onChange(tab.id)}
                aria-current={isActive ? "page" : undefined}
                className="relative flex h-16 w-full flex-col items-center justify-center gap-1"
              >
                {isActive && (
                  <motion.span
                    layoutId="nav-indicator"
                    className="absolute top-0 h-0.5 w-10 rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon
                  className="size-6 transition-colors"
                  style={{ color: isActive ? "var(--primary)" : "var(--muted-foreground)" }}
                />
                <span
                  className="text-[10px] font-medium transition-colors"
                  style={{ color: isActive ? "var(--primary)" : "var(--muted-foreground)" }}
                >
                  {tab.label}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}