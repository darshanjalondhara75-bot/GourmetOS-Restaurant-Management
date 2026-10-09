export interface MenuItem {
  id: string;
  name: string;
  category: "all" | "specials" | "mains" | "starters" | "desserts" | "drinks";
  price: number;
  badge?: string;
  desc: string;
  image: string;
  calories?: string;
  veg: boolean;
  inStock: boolean;
}

export const CULINARY_MENU: MenuItem[] = [
  {
    id: "item_1",
    name: "Prime Wagyu Ribeye A5",
    category: "mains",
    price: 68.0,
    badge: "Signature",
    desc: "Truffle herb butter, garlic glazed asparagus & 48-hour red wine demi-glace",
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80",
    calories: "820 kcal",
    veg: false,
    inStock: true,
  },
  {
    id: "item_2",
    name: "Black Truffle Cavatelli",
    category: "mains",
    price: 36.0,
    badge: "Chef Choice",
    desc: "Handmade semolina pasta, wild foraged chanterelles, 24-month aged parmigiano",
    image: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=600&auto=format&fit=crop&q=80",
    calories: "640 kcal",
    veg: true,
    inStock: true,
  },
  {
    id: "item_3",
    name: "Glazed Chilean Seabass",
    category: "mains",
    price: 52.0,
    badge: "Seafood",
    desc: "Miso mirin caramelized glaze, charred baby bok choy, citrus dashi emulsion",
    image: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600&auto=format&fit=crop&q=80",
    calories: "510 kcal",
    veg: false,
    inStock: true,
  },
  {
    id: "item_4",
    name: "Saffron Burrata Carpaccio",
    category: "starters",
    price: 24.0,
    badge: "Popular",
    desc: "Heirloom beefsteak tomatoes, 15-year balsamic drizzle, toasted pistachio dust",
    image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80",
    calories: "430 kcal",
    veg: true,
    inStock: true,
  },
  {
    id: "item_5",
    name: "Lobster Thermidor Tail",
    category: "specials",
    price: 58.0,
    badge: "Luxury",
    desc: "Cognac cream emulsion, Gruyère gratinée, fresh tarragon and brioche crust",
    image: "https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?w=600&auto=format&fit=crop&q=80",
    calories: "690 kcal",
    veg: false,
    inStock: true,
  },
  {
    id: "item_6",
    name: "Valrhona Dark Chocolate Sphere",
    category: "desserts",
    price: 22.0,
    badge: "Artisan",
    desc: "Poured hot salted caramel, hazelnut praline gelato, edible 24k gold leaf",
    image: "https://images.unsplash.com/photo-1579372786545-d24232daf58c?w=600&auto=format&fit=crop&q=80",
    calories: "480 kcal",
    veg: true,
    inStock: true,
  },
  {
    id: "item_7",
    name: "Smoked Ember Old Fashioned",
    category: "drinks",
    price: 18.0,
    badge: "Cocktail",
    desc: "Single barrel bourbon, flamed orange peel, bitters, hickory woodsmoke veil",
    image: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=600&auto=format&fit=crop&q=80",
    calories: "190 kcal",
    veg: true,
    inStock: true,
  },
  {
    id: "item_8",
    name: "Matcha Yuzu Basque Cheesecake",
    category: "desserts",
    price: 19.0,
    badge: "Pastry",
    desc: "Caramelized burnt crust, ceremonial grade Uji matcha, candied yuzu zest",
    image: "https://images.unsplash.com/photo-1508737027454-e6454ef45afd?w=600&auto=format&fit=crop&q=80",
    calories: "420 kcal",
    veg: true,
    inStock: true,
  },
];
