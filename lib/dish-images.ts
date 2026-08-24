import type { CookingCategory } from "./types"

export interface RecipeImageInput {
  nombre?: string
  categoria: CookingCategory
}

interface KeywordImageGroup {
  keywords: string[]
  urls: string[]
}

// Grupos de palabras clave ampliados con múltiples imágenes variadas por categoría
const KEYWORD_IMAGES: KeywordImageGroup[] = [
  // Huevos, Tortillas y Revueltos
  {
    keywords: ["huevo", "tortilla", "revuelto", "omett", "omelette"],
    urls: [
      "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=500&q=60",
      "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&q=60",
      "https://images.unsplash.com/photo-1608039829572-78524f79c4c7?w=500&q=60",
    ],
  },
  // Avena y Porridge
  {
    keywords: ["avena", "porridge", "gachas", "oats"],
    urls: [
      "https://images.unsplash.com/photo-1517673132405-a56a62b18caf?w=500&q=60",
      "https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?w=500&q=60",
      "https://images.unsplash.com/photo-1584947897568-129665893a9c?w=500&q=60",
    ],
  },
  // Tostadas y Panes
  {
    keywords: ["tostada", "pan", "avocado", "aguacate", "sandwich", "sándwich"],
    urls: [
      "https://images.unsplash.com/photo-1588137378633-dea1336ce1e2?w=500&q=60",
      "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=500&q=60",
      "https://images.unsplash.com/photo-1603046891744-1277a881395b?w=500&q=60",
    ],
  },
  // Tortitas, Pancakes y Waffles
  {
    keywords: ["pancake", "tortita", "crepe", "waffle", "gofre"],
    urls: [
      "https://images.unsplash.com/photo-1506084868230-bb9d95c24759?w=500&q=60",
      "https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=500&q=60",
      "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&q=60",
    ],
  },
  // Pollo y Pavo
  {
    keywords: ["pollo", "pechuga", "pavo", "alitas"],
    urls: [
      "https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=500&q=60",
      "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=500&q=60",
      "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=500&q=60",
      "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=500&q=60",
    ],
  },
  // Carnes Rojas y Hamburguesas
  {
    keywords: ["carne", "ternera", "hamburguesa", "filete", "steak", "lomo", "cerdo"],
    urls: [
      "https://images.unsplash.com/photo-1544025162-d76694265947?w=500&q=60",
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=60",
      "https://images.unsplash.com/photo-1558030006-450675393462?w=500&q=60",
      "https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=500&q=60",
    ],
  },
  // Salmón
  {
    keywords: ["salmon", "salmón"],
    urls: [
      "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=500&q=60",
      "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=500&q=60",
      "https://images.unsplash.com/photo-1574484284002-952d92456975?w=500&q=60",
    ],
  },
  // Otros Pescados y Mariscos
  {
    keywords: ["pescado", "atun", "atún", "merluza", "bacalao", "lubina", "gamba", "langostino", "marisco"],
    urls: [
      "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=500&q=60",
      "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=500&q=60",
      "https://images.unsplash.com/photo-1559847844-5315695dadae?w=500&q=60",
    ],
  },
  // Arroz y Cereales
  {
    keywords: ["arroz", "paella", "risotto", "quinoa"],
    urls: [
      "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=500&q=60",
      "https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=500&q=60",
      "https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=500&q=60",
    ],
  },
  // Pasta y Noodles
  {
    keywords: ["pasta", "espagueti", "spaghetti", "macarrones", "lasaña", "tallarines", "noodle"],
    urls: [
      "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=500&q=60",
      "https://images.unsplash.com/photo-1621996346565-e3d5d6288018?w=500&q=60",
      "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&q=60",
    ],
  },
  // Legumbres
  {
    keywords: ["lentejas", "garbanzos", "alubias", "frijoles", "legumbre"],
    urls: [
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=60",
      "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=500&q=60",
      "https://images.unsplash.com/photo-1515516969-d4008cc6241a?w=500&q=60",
    ],
  },
  // Ensaladas
  {
    keywords: ["ensalada", "salad"],
    urls: [
      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&q=60",
      "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&q=60",
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=60",
    ],
  },
  // Sopas y Cremas
  {
    keywords: ["sopa", "crema", "puré", "caldo", "gazpacho"],
    urls: [
      "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=500&q=60",
      "https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?w=500&q=60",
      "https://images.unsplash.com/photo-1588566565463-180a5b2090d2?w=500&q=60",
    ],
  },
  // Batidos y Shakes
  {
    keywords: ["batido", "smoothie", "shake", "proteina", "proteína"],
    urls: [
      "https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=500&q=60",
      "https://images.unsplash.com/photo-1502741126161-b048400d088d?w=500&q=60",
      "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500&q=60",
    ],
  },
  // Yogures y Bowls
  {
    keywords: ["yogur", "bowl", "chia", "chía", "requeson", "requesón", "queso batido"],
    urls: [
      "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=500&q=60",
      "https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?w=500&q=60",
      "https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=500&q=60",
    ],
  },
  // Frutas
  {
    keywords: ["fruta", "manzana", "platano", "plátano", "fresa", "macedonia"],
    urls: [
      "https://images.unsplash.com/photo-1495147466023-ac5c588e2e94?w=500&q=60",
      "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=500&q=60",
      "https://images.unsplash.com/photo-1519996529931-28324d5a630e?w=500&q=60",
    ],
  },
  // Postres Dulces y Repostería Fit
  {
    keywords: ["chocolate", "brownie", "tarta", "pastel", "bizcocho", "galleta"],
    urls: [
      "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&q=60",
      "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500&q=60",
      "https://images.unsplash.com/photo-1587314168485-3236d6710814?w=500&q=60",
    ],
  },
]

// Pool de reserva ampliado por categoría
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

/**
 * Devuelve una imagen determinista basada en el nombre de la receta y su índice dentro de la lista.
 * Mantiene compatibilidad total con llamadas anteriores `(categoria, index)`.
 */
export function getGenericImage(
  target: RecipeImageInput | CookingCategory,
  fallbackIndex: number = 0
): string {
  let categoria: CookingCategory
  let nombre: string | undefined

  if (typeof target === "string") {
    categoria = target
  } else {
    categoria = target.categoria
    nombre = target.nombre
  }

  if (nombre) {
    const nombreLower = nombre.toLowerCase()
    const matched = KEYWORD_IMAGES.find((group) =>
      group.keywords.some((kw) => nombreLower.includes(kw))
    )
    if (matched && matched.urls.length > 0) {
      return matched.urls[fallbackIndex % matched.urls.length]
    }
  }

  const pool = IMAGES_BY_CATEGORY[categoria] ?? IMAGES_BY_CATEGORY.almuerzo
  return pool[fallbackIndex % pool.length]
}

const GENERAL_IMAGES = [
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=60",
  "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&q=60",
  "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=500&q=60",
  "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=500&q=60",
  "https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=500&q=60",
]

export function getGenericGeneralImage(index: number): string {
  return GENERAL_IMAGES[index % GENERAL_IMAGES.length]
}