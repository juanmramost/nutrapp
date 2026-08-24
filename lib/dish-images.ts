export const DEFAULT_FOOD_IMAGE =
  "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800&auto=format&fit=crop&q=80"

const IMAGE_BANK: { keywords: string[]; urls: string[] }[] = [
  // 1. Batidos, Smoothies y Proteínas
  {
    keywords: ["batido", "smoothie", "licuado", "shake", "proteico", "proteina", "verde", "zumo", "jugo", "whey"],
    urls: [
      "https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1532712938310-34cb3982ef74?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1610970881699-44a5587cabec?w=800&auto=format&fit=crop&q=80",
    ],
  },
  // 2. Avena, Gachas, Porridge y Granola
  {
    keywords: ["avena", "gachas", "porridge", "oatmeal", "granola", "muesli", "cereales", "chia"],
    urls: [
      "https://images.unsplash.com/photo-1517673400267-0251440c45dc?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1584776296944-ab6fb57b0bdd?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=80",
    ],
  },
  // 3. Tortitas, Pancakes, Crepes y Gofres
  {
    keywords: ["pancake", "pancakes", "tortita", "tortitas", "crepe", "crepes", "waffle", "waffles", "gofre", "gofres"],
    urls: [
      "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=80",
    ],
  },
  // 4. Yogur, Queso Fresco, Kéfir y Bowls
  {
    keywords: ["yogur", "yogurt", "kefir", "cuajada", "requeson", "cottage", "skyr", "queso fresco", "arandanos", "berries", "fresa", "frambuesa"],
    urls: [
      "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?w=800&auto=format&fit=crop&q=80",
    ],
  },
  // 5. Tostadas y Panes Integrales
  {
    keywords: ["tostada", "tostadas", "pan", "centeno", "integral", "toast", "bagel", "mollete"],
    urls: [
      "https://images.unsplash.com/photo-1588137378633-dea1336ce1e2?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800&auto=format&fit=crop&q=80",
    ],
  },
  // 6. Sándwiches, Bocadillos, Wraps y Fajitas
  {
    keywords: ["sandwich", "sandwiches", "bocadillo", "bocata", "wrap", "wraps", "fajita", "fajitas", "burrito", "burritos", "durum", "kebab"],
    urls: [
      "https://images.unsplash.com/photo-1509722747041-616f39b57569?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=800&auto=format&fit=crop&q=80",
    ],
  },
  // 7. Huevos y Tortillas
  {
    keywords: ["tortilla", "huevo", "huevos", "revoltijo", "revuelto", "scramble", "omelette", "poche", "escalfado", "frito", "claras"],
    urls: [
      "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1510693206972-df098062cb71?w=800&auto=format&fit=crop&q=80",
    ],
  },
  // 8. Tofu, Tempeh y Proteína Vegana
  {
    keywords: ["tofu", "seitan", "tempeh", "heura", "soja", "soya", "vegetariano", "vegano", "edamame"],
    urls: [
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&auto=format&fit=crop&q=80",
    ],
  },
  // 9. Pollo y Pavo
  {
    keywords: ["pollo", "pavo", "pechuga", "muslo", "alitas", "chicken", "turkey", "contra muslo"],
    urls: [
      "https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=800&auto=format&fit=crop&q=80",
    ],
  },
  // 10. Ternera, Buey y Carnes Rojas
  {
    keywords: ["ternera", "buey", "lomo", "filete", "entrecot", "solomillo", "chuleton", "carne picada", "carne", "meat", "steak"],
    urls: [
      "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1558030006-450675393462?w=800&auto=format&fit=crop&q=80",
    ],
  },
  // 11. Cerdo, Jamón y Embutidos
  {
    keywords: ["cerdo", "pork", "secreto", "presa", "costillas", "bacon", "beicon", "jamon", "lomo embuchado"],
    urls: [
      "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=800&auto=format&fit=crop&q=80",
    ],
  },
  // 12. Hamburguesas
  {
    keywords: ["hamburguesa", "hamburguesas", "burger", "burgers", "smash"],
    urls: [
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=800&auto=format&fit=crop&q=80",
    ],
  },
  // 13. Pescado Blanco
  {
    keywords: ["merluza", "lubina", "bacalao", "dorada", "trucha", "lenguado", "emperador", "pescada", "gallo", "rodaballo"],
    urls: [
      "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?w=800&auto=format&fit=crop&q=80",
    ],
  },
  // 14. Pescado Azul
  {
    keywords: ["salmon", "atun", "bonito", "sardina", "sardinas", "caballa", "boquerones", "anchovas", "anchoas", "tuna"],
    urls: [
      "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800&auto=format&fit=crop&q=80",
    ],
  },
  // 15. Mariscos
  {
    keywords: ["gamba", "gambas", "langostino", "langostinos", "camaron", "camarones", "pulpo", "calamar", "calamares", "sepia", "choco", "mejillones", "almejas", "marisco"],
    urls: [
      "https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1535400255456-984241443b29?w=800&auto=format&fit=crop&q=80",
    ],
  },
  // 16. Arroz, Pokés, Bowls y Risotto
  {
    keywords: ["arroz", "rice", "poke", "bowl", "risotto", "paella", "quinoa", "cuscus", "couscous", "basmati", "integral"],
    urls: [
      "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=800&auto=format&fit=crop&q=80",
    ],
  },
  // 17. Pasta y Lasañas
  {
    keywords: ["pasta", "espagueti", "espaguetis", "macarrones", "tallarines", "penne", "fusilli", "lasana", "lasaña", "gnocchi", "ñoquis", "spaghetti", "noodle", "noodles", "canelones"],
    urls: [
      "https://images.unsplash.com/photo-1621996346565-e3d5d6281288?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80",
    ],
  },
  // 18. Pizza y Masa
  {
    keywords: ["pizza", "pizzas", "calzone", "focaccia"],
    urls: [
      "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&auto=format&fit=crop&q=80",
    ],
  },
  // 19. Sushi y Comida Asiática
  {
    keywords: ["sushi", "maki", "nigiri", "sashimi", "ramen", "gyoza", "gyozas", "wok", "teriyaki", "pad thai"],
    urls: [
      "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=800&auto=format&fit=crop&q=80",
    ],
  },
  // 20. Tacos y Comida Mexicana
  {
    keywords: ["taco", "tacos", "quesadilla", "quesadillas", "nachos", "guacamole", "totopos"],
    urls: [
      "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=800&auto=format&fit=crop&q=80",
    ],
  },
  // 21. Legumbres
  {
    keywords: ["garbanzo", "garbanzos", "lenteja", "lentejas", "alubia", "alubias", "judia", "judias", "hummus", "habas"],
    urls: [
      "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1538332576228-eb5b4c4de6f5?w=800&auto=format&fit=crop&q=80",
    ],
  },
  // 22. Ensaladas
  {
    keywords: ["ensalada", "salad", "cesar", "mediterranea", "canonigos", "rucula", "cogollos"],
    urls: [
      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80",
    ],
  },
  // 23. Cremas, Sopas y Purés
  {
    keywords: ["crema", "sopa", "pure", "gazpacho", "salmorejo", "caldo", "consome"],
    urls: [
      "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?w=800&auto=format&fit=crop&q=80",
    ],
  },
  // 24. Patatas, Boniato y Tubérculos
  {
    keywords: ["patata", "patatas", "papas", "batata", "boniato", "yuca", "fritas", "asadas", "cocidas", "pure de patata"],
    urls: [
      "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=800&auto=format&fit=crop&q=80",
    ],
  },
  // 25. Verduras y Hortalizas
  {
    keywords: ["verdura", "verduras", "espinacas", "brocoli", "calabacin", "berenjena", "esparragos", "esparrago", "pimiento", "pimientos", "tomate", "salteado", "menestra", "escalivada", "parrillada"],
    urls: [
      "https://images.unsplash.com/photo-1592417817098-8f3d6eb19657?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80",
    ],
  },
  // 26. Guisos y Platos Tradicionales
  {
    keywords: ["estofado", "guiso", "cocido", "fabada", "potaje", "marmitako", "cazuela", "rabo de toro", "carrilleras", "puchero"],
    urls: [
      "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1538332576228-eb5b4c4de6f5?w=800&auto=format&fit=crop&q=80",
    ],
  },
  // 27. Frutos Secos y Snacks
  {
    keywords: ["almendras", "nueces", "cacahuetes", "avellanas", "anacardos", "pistachos", "pipas", "semillas", "snack", "frutos secos"],
    urls: [
      "https://images.unsplash.com/photo-1508061252966-f7289b278d16?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=800&auto=format&fit=crop&q=80",
    ],
  },
  // 28. Postres Fit, Repostería y Dulces
  {
    keywords: ["tarta", "cheesecake", "brownie", "chocolate", "mousse", "galleta", "galletas", "cookie", "cookies", "bizcocho", "dulce", "postre", "flan", "natillas", "muffin", "cupcake"],
    urls: [
      "https://images.unsplash.com/photo-1508737027454-e6454ef46afd?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800&auto=format&fit=crop&q=80",
    ],
  },
  // 29. Fruta Fresca
  {
    keywords: ["manzana", "platano", "banana", "naranja", "kiwi", "mango", "pina", "piña", "sandia", "melon", "melocoton", "albaricoque", "uvas", "higos", "fruta", "frutas"],
    urls: [
      "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1490818387583-1baba5e638af?w=800&auto=format&fit=crop&q=80",
    ],
  },
  // 30. Café, Té y Infusiones
  {
    keywords: ["cafe", "coffee", "cappuccino", "espresso", "latte", "te", "matcha", "infusion", "kombucha"],
    urls: [
      "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800&auto=format&fit=crop&q=80",
    ],
  },
]

export function getGenericImage(dish?: { nombre?: string; categoria?: string }, index = 0): string {
  if (!dish?.nombre) return DEFAULT_FOOD_IMAGE

  const nameNormalized = dish.nombre
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")

  for (const entry of IMAGE_BANK) {
    if (entry.keywords.some((kw) => nameNormalized.includes(kw))) {
      return entry.urls[index % entry.urls.length]
    }
  }

  return DEFAULT_FOOD_IMAGE
}

export function getGenericGeneralImage(index = 0): string {
  return DEFAULT_FOOD_IMAGE
}