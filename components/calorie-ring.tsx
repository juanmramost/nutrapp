"use client"

import { motion } from "motion/react"
import type { DayTotals } from "@/lib/nutrition"

interface Props {
  totals: DayTotals
  size?: number
}

/**
 * Anillo de progreso: muestra las calorías ingeridas frente al gasto total del día.
 * El centro resalta el déficit neto (verde) o superávit (rojo).
 */
export function CalorieRing({ totals, size = 220 }: Props) {
  const stroke = 18
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius

  const ratio = totals.gastoTotal > 0 ? totals.ingeridas / totals.gastoTotal : 0
  const clamped = Math.min(ratio, 1)
  const over = ratio > 1

  const enDeficit = totals.deficitNeto >= 0
  const centerColor = enDeficit ? "var(--exercise)" : "var(--surplus)"

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--muted)"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={over ? "var(--surplus)" : "var(--food)"}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - clamped) }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {enDeficit ? "Déficit neto" : "Superávit"}
        </span>
        <motion.span
          key={totals.deficitNeto}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold tabular-nums"
          style={{ color: centerColor }}
        >
          {enDeficit ? "-" : "+"}
          {Math.abs(totals.deficitNeto)}
        </motion.span>
        <span className="text-xs text-muted-foreground">kcal</span>
      </div>
    </div>
  )
}
