"use client"

import { useState } from "react"
import { Check } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useTracker } from "@/hooks/use-tracker"
import { useAuth } from "@/hooks/use-auth"
import { calcBasal } from "@/lib/nutrition"
import { calculateImc, getProfileImc, getImcCategory } from "@/lib/profile"
import type { Genero, Objetivo, UserProfile } from "@/lib/types"

function Field({
  label,
  value,
  onChange,
  suffix,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  suffix: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="relative">
        <Input
          type="number"
          inputMode="numeric"
          value={Number.isFinite(value) ? value : 0}
          onChange={(e) => onChange(Number(e.target.value))}
          className="h-12 pr-12 tabular-nums"
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
          {suffix}
        </span>
      </div>
    </div>
  )
}

const OBJETIVOS: { value: Objetivo; label: string }[] = [
  { value: "perder_peso", label: "Perder peso" },
  { value: "ganar_musculo", label: "Ganar músculo" },
  { value: "mantener", label: "Mantener" },
  { value: "mejorar_salud", label: "Mejorar salud" },
]

export function ProfileView() {
  const { profile, setProfile } = useTracker()
  const { user, isGuest, signOut, clearGuest } = useAuth()
  const [draft, setDraft] = useState<UserProfile>(profile)
  const [savedProfile, setSavedProfile] = useState(false)

  const basalCalculado = calcBasal(draft)
  const autoImc = calculateImc(draft.peso_kg, draft.altura_cm)
  const imcActual = getProfileImc(draft)
  const imcCategoria = getImcCategory(imcActual)

  function update<K extends keyof UserProfile>(k: K, v: UserProfile[K]) {
    setDraft((d) => ({ ...d, [k]: v }))
    setSavedProfile(false)
  }

  function handleSaveProfile() {
    const next: UserProfile = {
      ...draft,
      tdee_basal: draft.auto_basal ? basalCalculado : draft.tdee_basal,
    }
    setProfile(next)
    setDraft(next)
    setSavedProfile(true)
  }

  return (
    <div className="flex flex-col gap-5 px-4 pb-4 pt-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Perfil y ajustes</h1>
        <p className="text-sm text-muted-foreground">Tus datos definen tu gasto calórico en reposo</p>
      </header>

      <Card className="gap-4 px-4">
        <h2 className="text-sm font-semibold">Datos corporales</h2>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">Género</Label>
          <div className="grid grid-cols-2 gap-2">
            {(["hombre", "mujer"] as Genero[]).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => update("genero", g)}
                className={`h-11 rounded-xl text-sm font-medium capitalize transition-colors ${
                  draft.genero === g
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Field label="Peso" value={draft.peso_kg} suffix="kg" onChange={(v) => update("peso_kg", v)} />
          <Field label="Altura" value={draft.altura_cm} suffix="cm" onChange={(v) => update("altura_cm", v)} />
          <Field label="Edad" value={draft.edad} suffix="años" onChange={(v) => update("edad", v)} />
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">IMC (opcional)</Label>
            {imcCategoria && (
              <span className="text-xs font-medium text-muted-foreground">{imcCategoria}</span>
            )}
          </div>
          <Input
            type="number"
            inputMode="decimal"
            placeholder={autoImc !== null ? String(autoImc) : "—"}
            value={draft.imc ?? ""}
            onChange={(e) => {
              const raw = e.target.value
              if (raw === "") {
                update("imc", undefined as unknown as number)
                return
              }
              update("imc", Number(raw))
            }}
            className="h-12 tabular-nums"
          />
          <p className="text-xs text-muted-foreground">
            Calculado automáticamente a partir de tu peso y altura. Puedes sobrescribirlo si te lo has medido
            con otro método (ej. báscula de bioimpedancia).
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">Objetivo</Label>
          <div className="grid grid-cols-2 gap-2">
            {OBJETIVOS.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => update("objetivo", o.value)}
                className={`h-11 rounded-xl text-sm font-medium transition-colors ${
                  draft.objetivo === o.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card className="gap-4 px-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Calorías basales de reposo</h2>
        </div>

        <div className="rounded-xl bg-muted/50 p-4 text-center">
          <p className="text-xs text-muted-foreground">Estimación Mifflin-St Jeor</p>
          <p className="text-3xl font-bold tabular-nums text-deficit">{basalCalculado}</p>
          <p className="text-xs text-muted-foreground">kcal / día</p>
        </div>

        <label className="flex items-center justify-between gap-3">
          <span className="text-sm">Calcular automáticamente</span>
          <button
            type="button"
            role="switch"
            aria-checked={draft.auto_basal}
            onClick={() => update("auto_basal", !draft.auto_basal)}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
              draft.auto_basal ? "bg-deficit" : "bg-muted"
            }`}
          >
            <span
              className={`absolute top-0.5 size-5 rounded-full bg-background transition-transform ${
                draft.auto_basal ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        </label>

        {!draft.auto_basal && (
          <Field
            label="Ajuste manual de calorías basales"
            value={draft.tdee_basal}
            suffix="kcal"
            onChange={(v) => update("tdee_basal", v)}
          />
        )}
      </Card>

      <Button className="h-12 w-full gap-2" onClick={handleSaveProfile}>
        {savedProfile ? <Check className="size-4" /> : null}
        {savedProfile ? "Perfil guardado" : "Guardar perfil"}
      </Button>

      <div className="mt-4">
        {user ? (
          <Button variant="outline" className="w-full" onClick={() => signOut()}>
            Cerrar sesión
          </Button>
        ) : isGuest ? (
          <Button variant="outline" className="w-full" onClick={() => { clearGuest(); window.location.reload() }}>
            Salir de invitado
          </Button>
        ) : (
          <a href="/login">
            <Button variant="outline" className="w-full">Iniciar sesión</Button>
          </a>
        )}
      </div>

      <p className="pb-2 text-center text-xs text-muted-foreground">
        Déficit · Tracker con IA de Gemini
      </p>
    </div>
  )
}