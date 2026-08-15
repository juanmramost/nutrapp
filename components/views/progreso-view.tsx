"use client"

import { useEffect, useMemo, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription, DialogTrigger, DialogClose } from "@/components/ui/dialog"
import { dateKey, loadDeficits, loadLogs, setDeficit, removeDeficit } from "@/lib/storage"

function formatDate(k: string) {
  return k
}

function lastNDates(n: number) {
  const arr: string[] = []
  for (let i = 0; i < n; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    arr.push(dateKey(d))
  }
  return arr
}

export function ProgresoView() {
  const today = dateKey()
  const [deficits, setDeficits] = useState<Record<string, number>>({})
  const [confirmBulkOpen, setConfirmBulkOpen] = useState(false)

  useEffect(() => {
    function loadVisibleDeficits() {
      const d = loadDeficits()
      const logs = loadLogs()
      const out: Record<string, number> = {}
      for (const k of Object.keys(d)) {
        const entries = logs[k] ?? []
        if (entries.length > 0) out[k] = d[k]
      }
      return out
    }

    setDeficits(loadVisibleDeficits())
  }, [])

  useEffect(() => {
    function loadVisibleDeficits() {
      const d = loadDeficits()
      const logs = loadLogs()
      const out: Record<string, number> = {}
      for (const k of Object.keys(d)) {
        const entries = logs[k] ?? []
        if (entries.length > 0) out[k] = d[k]
      }
      return out
    }

    function handler() {
      setDeficits(loadVisibleDeficits())
    }
    if (typeof window !== "undefined") {
      window.addEventListener("deficits:changed", handler)
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("deficits:changed", handler)
      }
    }
  }, [])

  function handleDelete(dk: string) {
    const ok = window.confirm(`Eliminar registro para la fecha ${dk}?`)
    if (!ok) return
    removeDeficit(dk)
    setDeficits(loadDeficits())
  }

  function handleBulkDelete() {
    setConfirmBulkOpen(true)
  }

  function confirmBulkDelete() {
    const keys = last7
    for (const k of keys) {
      removeDeficit(k)
    }
    setDeficits(loadDeficits())
    setConfirmBulkOpen(false)
  }

  const last7 = useMemo(() => lastNDates(7), [])
  const weeklyTotal = last7.reduce((s, d) => s + (deficits[d] ?? 0), 0)

  return (
    <div className="flex flex-col gap-5 px-4 pb-4 pt-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Progreso</h1>
        <p className="text-sm text-muted-foreground">Registra el déficit diario y revisa el total semanal</p>
      </header>

      <Card className="gap-4 px-4">
        <h2 className="text-sm font-semibold">Déficit diario (automático)</h2>
        <p className="text-xs text-muted-foreground">
          Los déficits se registran automáticamente al guardar comidas o entrenos. Aquí puedes revisar y
          eliminar registros si es necesario.
        </p>
      </Card>

      <Card className="gap-4 px-4">
        <h2 className="text-sm font-semibold">Últimos registros</h2>
        <div className="w-full overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground">
                <th className="py-2">Fecha</th>
                <th className="py-2">Déficit (kcal)</th>
                <th className="py-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(deficits)
                .sort((a, b) => (a < b ? 1 : -1))
                .map((d) => (
                  <tr key={d} className="border-t">
                    <td className="py-2">{formatDate(d)}</td>
                    <td className="py-2">{deficits[d]}</td>
                    <td className="py-2">
                          <Button variant="ghost" onClick={() => handleDelete(d)}>
                            Eliminar
                          </Button>
                    </td>
                  </tr>
                ))}
              {Object.keys(deficits).length === 0 && (
                <tr>
                  <td colSpan={3} className="py-4 text-center text-xs text-muted-foreground">
                    No hay registros aún
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="gap-4 px-4">
        <h2 className="text-sm font-semibold">Resumen semanal</h2>
        <p className="text-sm text-muted-foreground">Total déficit últimos 7 días</p>
        <div className="text-3xl font-bold tabular-nums text-deficit">{weeklyTotal}</div>
        <div className="flex gap-2 mt-2">
          {last7.map((d) => (
            <div key={d} className="rounded-xl bg-muted/50 p-2 text-center text-xs w-1/6">
              <div className="text-muted-foreground">{d.slice(5)}</div>
              <div className="font-medium">{deficits[d] ?? 0} kcal</div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          <Button variant="secondary" onClick={handleBulkDelete} className="w-full">
            Eliminar últimos 7 registros
          </Button>
        </div>
      </Card>

      {/* single delete uses native confirm() via handleDelete */}

      {/* Confirm bulk delete */}
      <Dialog open={confirmBulkOpen} onOpenChange={setConfirmBulkOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar últimos registros</DialogTitle>
            <DialogDescription>Se eliminarán los registros de los últimos 7 días. ¿Confirmas?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button onClick={confirmBulkDelete} className="bg-destructive text-destructive-foreground">
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ProgresoView
