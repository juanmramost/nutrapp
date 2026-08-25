import { DEFAULT_FOOD_IMAGE } from "@/lib/dish-images"

interface DishImageProps {
  src: string
  alt: string
  className?: string
}

/**
 * <img> con fallback automático a la imagen genérica si la URL falla
 * (Unsplash caído, foto borrada, etc). Antes esto se repetía inline en
 * cada vista con el mismo onError.
 */
export function DishImage({ src, alt, className }: DishImageProps) {
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={(e) => {
        if (e.currentTarget.src !== DEFAULT_FOOD_IMAGE) {
          e.currentTarget.src = DEFAULT_FOOD_IMAGE
        }
      }}
      className={className}
    />
  )
}