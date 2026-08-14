"use client"

import { useState } from "react"
import { Check, Eye, EyeOff, KeyRound } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useTracker } from "@/hooks/use-tracker"
import { calcBasal } from "@/lib/nutrition"
import type { Genero, UserProfile } from "@/lib/types"

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

export function ProfileView() {
  const { profile, setProfile, apiKey, setApiKey } = useTracker()
  const [draft, setDraft] = useState<UserProfile>(profile)
  const [keyDraft, setKeyDraft] = useState(apiKey)
  const [showKey, setShowKey] = useState(false)
  const [savedProfile, setSavedProfile] = useState(false)
  const [savedKey, setSavedKey] = useState(false)

  const basalCalculado = calcBasal(draft)

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

  function handleSaveKey() {
    setApiKey(keyDraft)
    setSavedKey(true)
    setTimeout(() => setSavedKey(false), 2000)
  }

  return (
    <div className="flex flex-col gap-5 px-4 pb-4 pt-6">
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

      <Card className="gap-4 px-4">
        <div className="flex items-center gap-2">
          <KeyRound className="size-4 text-food" />
          <h2 className="text-sm font-semibold">Gemini API Key</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          Se guarda en tu dispositivo (localStorage) y se usa para analizar tus fotos con la IA.
        </p>
        <div className="relative">
          <Input
            type={showKey ? "text" : "password"}
            value={keyDraft}
            onChange={(e) => {
              setKeyDraft(e.target.value)
              setSavedKey(false)
            }}
            placeholder="AIza..."
            className="h-12 pr-12 font-mono"
            autoComplete="off"
          />
          <button
            type="button"
            onClick={() => setShowKey((s) => !s)}
            aria-label={showKey ? "Ocultar clave" : "Mostrar clave"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          >
            {showKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        <Button
          variant="secondary"
          className="h-12 w-full gap-2"
          onClick={handleSaveKey}
          disabled={keyDraft.trim() === apiKey.trim()}
        >
          {savedKey ? <Check className="size-4" /> : null}
          {savedKey ? "Clave guardada" : "Guardar clave"}
        </Button>
      </Card>

      <p className="pb-2 text-center text-xs text-muted-foreground">
        Déficit · Tracker con IA de Gemini
      </p>
    </div>
  )
}
