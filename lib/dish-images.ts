import type { CookingCategory } from "./types"

/**
 * Imágenes genéricas fijas (URLs directas de Unsplash CDN, sin API keys ni llamadas de red
 * en tiempo de generación). Se eligen de forma determinista por categoría + índice, así que
 * el mismo plato siempre muestra la misma imagen mientras no cambie el ciclo de 5 días.
 */
const IMAGES_BY_CATEGORY: Record<CookingCategory, string[]> = {
  desayuno: [
    "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=500&q=60",
    "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=500&q=60",
    "https://images.unsplash.com/photo-1494859802809-d069c3b71a8a?w=500&q=60",
    "https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=500&q=60",
    "https://images.unsplash.com/photo-1517673132405-a56a62b18caf?w=500&q=60",
    "https://images.unsplash.com/photo-1506084868230-bb9d95c24759?w=500&q=60",
  ],
  almuerzo: [
    "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&q=60",
    "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=500&q=60",
    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=60",
    "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=500&q=60",
    "https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=500&q=60",
    "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=500&q=60",
  ],
  postre: [
    "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=500&q=60",
    "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=500&q=60",
    "https://images.unsplash.com/photo-1587314168485-3236d6710814?w=500&q=60",
    "https://images.unsplash.com/photo-1495147466023-ac5c588e2e94?w=500&q=60",
    "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=500&q=60",
    "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=500&q=60",
  ],
  cena: [
    "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=500&q=60",
    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=500&q=60",
    "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=500&q=60",
    "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500&q=60",
    "https://images.unsplash.com/photo-1544025162-d76694265947?w=500&q=60",
    "https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?w=500&q=60",
  ],
}

/** Devuelve una imagen genérica determinista para una receta según su categoría e índice dentro de ella. */
export function getGenericImage(categoria: CookingCategory, indexInCategory: number): string {
  const pool = IMAGES_BY_CATEGORY[categoria]
  return pool[indexInCategory % pool.length]
}