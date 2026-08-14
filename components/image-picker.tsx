"use client"

import { useRef } from "react"
import { Camera, ImageIcon, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Props {
  previewUrl: string | null
  onSelect: (file: File) => void
  onClear: () => void
  accentColor: string
}

export function ImagePicker({ previewUrl, onSelect, onClear, accentColor }: Props) {
  const cameraRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) onSelect(file)
    e.target.value = ""
  }

  if (previewUrl) {
    return (
      <div className="relative overflow-hidden rounded-2xl ring-1 ring-foreground/10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={previewUrl || "/placeholder.svg"} alt="Vista previa" className="aspect-square w-full object-cover" />
        <button
          type="button"
          onClick={onClear}
          aria-label="Quitar foto"
          className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full bg-background/70 text-foreground backdrop-blur"
        >
          <X className="size-5" />
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handleChange} className="hidden" />
      <input ref={galleryRef} type="file" accept="image/*" onChange={handleChange} className="hidden" />

      <button
        type="button"
        onClick={() => cameraRef.current?.click()}
        className="flex aspect-square w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border text-muted-foreground transition-colors active:bg-muted/50"
      >
        <span
          className="flex size-16 items-center justify-center rounded-full"
          style={{ backgroundColor: `color-mix(in oklch, ${accentColor} 20%, transparent)`, color: accentColor }}
        >
          <Camera className="size-8" />
        </span>
        <span className="text-sm font-medium text-foreground">Tomar foto</span>
      </button>

      <Button
        type="button"
        variant="secondary"
        className="h-12 w-full gap-2"
        onClick={() => galleryRef.current?.click()}
      >
        <ImageIcon className="size-4" />
        Subir de la galería
      </Button>
    </div>
  )
}
