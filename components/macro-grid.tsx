interface MacroGridProps {
  kcal: number
  proteinas: number
  carbohidratos: number
  grasas: number
  className?: string
}

/**
 * Grid de 4 columnas con kcal/prot/carb/gras, reutilizado en la tarjeta
 * de lista y en la vista de detalle de cada receta.
 */
export function MacroGrid({ kcal, proteinas, carbohidratos, grasas, className }: MacroGridProps) {
  return (
    <div className={`grid grid-cols-4 gap-2 rounded-xl bg-muted/50 p-3 text-center text-xs ${className ?? ""}`}>
      <div>
        <p className="font-bold tabular-nums text-food">{kcal}</p>
        <p className="text-muted-foreground">kcal</p>
      </div>
      <div>
        <p className="font-bold tabular-nums">{proteinas}g</p>
        <p className="text-muted-foreground">Prot</p>
      </div>
      <div>
        <p className="font-bold tabular-nums">{carbohidratos}g</p>
        <p className="text-muted-foreground">Carb</p>
      </div>
      <div>
        <p className="font-bold tabular-nums">{grasas}g</p>
        <p className="text-muted-foreground">Gras</p>
      </div>
    </div>
  )
}