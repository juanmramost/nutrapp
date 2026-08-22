"use client"

import { useState } from "react"
import { ChefHat, BookOpen, Sparkles, Soup, ChevronRight } from "lucide-react"
import { Card } from "@/components/ui/card"
import { MisPlatosView } from "@/components/views/mis-platos-view"
import { RecomendadosView } from "@/components/views/recomendados-view"

type CocinaSection = "menu" | "mis-platos" | "recomendados" | "que-cocinar"

interface SectionOption {
  id: CocinaSection
  title: string
  description: string
  icon: React.ReactNode
  accent: string
}

const SECTIONS: SectionOption[] = [
  {
    id: "mis-platos",
    title: "Mis platos",
    description: "Guarda tus recetas favoritas con sus datos nutricionales, para reutilizarlas cuando quieras.",
    icon: <BookOpen className="size-5" />,
    accent: "var(--food)",
  },
  {
    id: "recomendados",
    title: "Platos recomendados por IA",
    description: "Ideas de desayuno, almuerzo, postre y cena pensadas para tu objetivo. Se renuevan cada 5 días.",
    icon: <Sparkles className="size-5" />,
    accent: "var(--deficit)",
  },
  {
    id: "que-cocinar",
    title: "¿Qué puedo cocinar?",
    description: "Cuéntale a la IA qué ingredientes tienes y te propone 3 recetas distintas al momento.",
    icon: <Soup className="size-5" />,
    accent: "var(--exercise)",
  },
]

export function CocinaView() {
  const [section, setSection] = useState<CocinaSection>("menu")

  if (section === "mis-platos") {
    return <MisPlatosView onBack={() => setSection("menu")} />
  }

  if (section === "recomendados") {
    return <RecomendadosView onBack={() => setSection("menu")} />
  }

  if (section !== "menu") {
    return (
      <div className="flex flex-col gap-5 px-4 pb-4 pt-8">
        <button
          type="button"
          onClick={() => setSection("menu")}
          className="self-start text-sm font-medium text-muted-foreground"
        >
          ← Volver a Cocina
        </button>
        <Card className="items-center gap-2 py-10 text-center">
          <ChefHat className="size-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Esta sección estará disponible muy pronto.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 px-4 pb-4 pt-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Cocina</h1>
        <p className="text-sm text-muted-foreground">Tu asistente para decidir, guardar y crear recetas</p>
      </header>

      <div className="flex flex-col gap-3">
        {SECTIONS.map((s) => (
          <button key={s.id} type="button" onClick={() => setSection(s.id)} className="text-left">
            <Card className="flex-row items-center gap-4 p-4">
              <div
                className="flex size-11 shrink-0 items-center justify-center rounded-xl"
                style={{
                  backgroundColor: `color-mix(in oklch, ${s.accent} 20%, transparent)`,
                  color: s.accent,
                }}
              >
                {s.icon}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{s.title}</p>
                <p className="text-xs text-muted-foreground">{s.description}</p>
              </div>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </Card>
          </button>
        ))}
      </div>
    </div>
  )
}