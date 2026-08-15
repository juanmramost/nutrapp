"use client"

import { motion } from "motion/react"
import { Activity, Flame, Moon, Trash2, UtensilsCrossed } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CalorieRing } from "@/components/calorie-ring"
import { useTracker } from "@/hooks/use-tracker"
import { isMeal } from "@/lib/nutrition"

function MacroBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold tabular-nums">{value} g</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  unit,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: number
  unit: string
  color: string
}) {
  return (
    <Card className="gap-2 p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <span style={{ color }}>{icon}</span>
        <span className="text-xs font-medium">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold tabular-nums" style={{ color }}>
          {value}
        </span>
        <span className="text-xs text-muted-foreground">{unit}</span>
      </div>
    </Card>
  )
}

export function DashboardView() {
  const { totals, todayEntries, removeToday, profile } = useTracker()

  function handleRemove(id: string) {
    const ok = window.confirm("Eliminar registro de hoy?")
    if (!ok) return
    removeToday(id)
  }

  const today = new Date().toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })

  const proteinTarget = Math.round(profile.peso_kg * 2)

  return (
    <div className="flex flex-col gap-6 px-4 pb-4 pt-6">
      <header>
        <p className="text-sm capitalize text-muted-foreground">{today}</p>
        <h1 className="text-2xl font-bold tracking-tight">Hoy</h1>
      </header>

      <Card className="items-center gap-5 p-6">
        <CalorieRing totals={totals} />
        <div className="grid w-full grid-cols-2 gap-3 text-center text-sm">
          <div className="rounded-xl bg-muted/50 py-2">
            <p className="text-xs text-muted-foreground">Ingeridas</p>
            <p className="font-bold tabular-nums text-food">{totals.ingeridas}</p>
          </div>
          <div className="rounded-xl bg-muted/50 py-2">
            <p className="text-xs text-muted-foreground">Gasto total</p>
            <p className="font-bold tabular-nums text-exercise">{totals.gastoTotal}</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={<UtensilsCrossed className="size-4" />}
          label="Kcal Ingeridas"
          value={totals.ingeridas}
          unit="kcal"
          color="var(--food)"
        />
        <StatCard
          icon={<Activity className="size-4" />}
          label="Quemadas Activas"
          value={totals.quemadasActivas}
          unit="kcal"
          color="var(--exercise)"
        />
        <StatCard
          icon={<Moon className="size-4" />}
          label="Reposo / Basal"
          value={totals.basal}
          unit="kcal"
          color="var(--deficit)"
        />
        <StatCard
          icon={<Flame className="size-4" />}
          label="Déficit Neto"
          value={totals.deficitNeto}
          unit="kcal"
          color={totals.deficitNeto >= 0 ? "var(--exercise)" : "var(--surplus)"}
        />
      </div>

      <Card className="gap-4 p-4">
        <h2 className="text-sm font-semibold">Macronutrientes</h2>
        <MacroBar label="Proteínas" value={totals.proteinas} max={proteinTarget} color="var(--deficit)" />
        <MacroBar label="Carbohidratos" value={totals.carbohidratos} max={300} color="var(--food)" />
        <MacroBar label="Grasas" value={totals.grasas} max={80} color="var(--exercise)" />
      </Card>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">Registro del día</h2>
        {todayEntries.length === 0 ? (
          <Card className="items-center gap-1 py-10 text-center">
            <UtensilsCrossed className="size-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Aún no has registrado nada hoy</p>
          </Card>
        ) : (
          <ul className="flex flex-col gap-2">
            {todayEntries
              .slice()
              .reverse()
              .map((entry) => (
                <motion.li
                  key={entry.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <div className="flex items-center gap-3 rounded-xl bg-card p-3 ring-1 ring-foreground/10">
                    <div
                      className="flex size-10 shrink-0 items-center justify-center rounded-xl"
                      style={{
                        backgroundColor: isMeal(entry) ? "color-mix(in oklch, var(--food) 20%, transparent)" : "color-mix(in oklch, var(--exercise) 20%, transparent)",
                        color: isMeal(entry) ? "var(--food)" : "var(--exercise)",
                      }}
                    >
                      {isMeal(entry) ? <UtensilsCrossed className="size-5" /> : <Activity className="size-5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {isMeal(entry) ? entry.plato : entry.tipo_actividad}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {isMeal(entry)
                          ? `${entry.calorias} kcal · P${entry.proteinas_g} C${entry.carbohidratos_g} G${entry.grasas_g}`
                          : `${entry.calorias_activas} kcal quemadas`}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemove(entry.id)}
                      aria-label="Borrar registro"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </motion.li>
              ))}
          </ul>
        )}
      </section>
    </div>
  )
}
