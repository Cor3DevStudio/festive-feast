export interface Product {
  id: string;
  name: string;
  slug: string;
  category: "parols" | "lights" | "holiday-decor";
  price: number;
  priceRange?: [number, number];
  description: string;
  fullDescription: string;
  sizes: string[];
  images: string[];
  badge?: string;
  inStock: boolean;
  stockCount?: number;
  materials?: string;
  dimensions?: string;
}

export const products: Product[] = [
  {
    id: "1",
    name: "Capiz Star Parol",
    slug: "capiz-star-parol",
    category: "parols",
    price: 1499,
    priceRange: [1499, 2899],
    description: "A traditional Filipino star lantern handcrafted with genuine capiz shells. Illuminates beautifully when lit, casting a warm, pearlescent glow throughout your home.",
    fullDescription: "The Capiz Star Parol is the quintessential Filipino Christmas lantern, handcrafted by skilled artisans in Pampanga. Each parol features genuine capiz shells carefully arranged in a radiant star pattern. When illuminated, the capiz shells create a mesmerizing pearlescent glow that fills any room with warmth and holiday spirit.\n\nEach piece is unique, with slight natural variations in the capiz shells that add to its artisanal charm. The frame is made from durable bamboo strips, ensuring the parol maintains its shape season after season.\n\nIncludes LED bulb and 3-meter cord with switch.",
    sizes: ['12"', '18"', '24"'],
    images: [],
    badge: "Bestseller",
    inStock: true,
    stockCount: 24,
    materials: "Capiz shells, bamboo frame, LED bulb",
    dimensions: '12" / 18" / 24" diameter',
  },
  {
    id: "2",
    name: "Giant Cathedral Parol",
    slug: "giant-cathedral-parol",
    category: "parols",
    price: 3499,
    description: "An impressive large-scale parol inspired by the grand lanterns of San Fernando. Features intricate cut-out patterns and warm LED lighting.",
    fullDescription: "Inspired by the legendary Giant Lantern Festival of San Fernando, Pampanga, this Cathedral Parol brings the grandeur of the festival into your home. The intricate geometric cut-out patterns cast dramatic shadow play on surrounding walls when illuminated.\n\nMade with premium-grade materials and fitted with energy-efficient warm LED lights that last throughout the season. Comes with a sturdy hanging kit suitable for both indoor and outdoor display.\n\nA true statement piece for your Filipino Christmas celebration.",
    sizes: ['36"', '48"'],
    images: [],
    badge: "New arrival",
    inStock: true,
    stockCount: 8,
    materials: "Acetate, wire frame, warm LED strip",
    dimensions: '36" / 48" diameter',
  },
  {
    id: "3",
    name: "Warm White Fairy Lights",
    slug: "warm-white-fairy-lights",
    category: "lights",
    price: 349,
    description: "Delicate copper wire fairy lights with warm white LEDs. Perfect for wrapping around your parol, Christmas tree, or draping along windowsills.",
    fullDescription: "These enchanting warm white fairy lights add a magical touch to any holiday setup. The ultra-thin copper wire is flexible and easy to shape around trees, mantels, wreaths, or your favorite parol.\n\n100 micro-LED bulbs emit a soft, warm glow that creates an intimate festive atmosphere. Battery-operated with timer function (6 hours on / 18 hours off) for hassle-free use.\n\nWaterproof rating: IP44 — suitable for indoor and covered outdoor use.",
    sizes: ["5m (50 LEDs)", "10m (100 LEDs)"],
    images: [],
    inStock: true,
    stockCount: 56,
    materials: "Copper wire, micro-LED",
    dimensions: "5m or 10m length",
  },
  {
    id: "4",
    name: "Multicolor Rice Lights",
    slug: "multicolor-rice-lights",
    category: "lights",
    price: 199,
    description: "Classic multicolor rice lights, a staple of every Filipino Christmas. Brings nostalgic charm to any indoor or outdoor space.",
    fullDescription: "Nothing says Pasko like the cheerful glow of multicolor rice lights! These classic Filipino Christmas lights come in vivid red, green, blue, yellow, and orange — perfect for that nostalgic holiday look.\n\nEach strand features 100 durable rice bulbs with end-to-end connectors, so you can link up to 5 strands for larger displays. Indoor/outdoor rated with a sturdy waterproof plug.\n\nA must-have for every Filipino home during the holidays.",
    sizes: ["5m", "10m", "20m"],
    images: [],
    badge: "Holiday sale",
    inStock: true,
    stockCount: 120,
    materials: "PVC wire, rice bulbs",
    dimensions: "5m / 10m / 20m length",
  },
  {
    id: "5",
    name: "Nativity Set (Belen)",
    slug: "nativity-set-belen",
    category: "holiday-decor",
    price: 2199,
    description: "A beautifully hand-painted resin nativity set featuring the Holy Family, Three Kings, shepherd, and animals. A centerpiece of Filipino Christmas tradition.",
    fullDescription: "This exquisite Nativity Set (Belen) captures the heart of the Filipino Christmas — the birth of Jesus. Each figure is meticulously hand-painted with warm, earthy tones and delicate gold accents.\n\nThe set includes 11 pieces: the Holy Family (Mary, Joseph, Baby Jesus), Three Kings, an angel, a shepherd, and three animals (donkey, cow, sheep). The stable/manger is crafted from natural wood with a thatched roof.\n\nA timeless centerpiece that tells the story of Christmas for generations to come.",
    sizes: ["Standard (8-piece)", "Deluxe (11-piece)"],
    images: [],
    inStock: true,
    stockCount: 15,
    materials: "Hand-painted resin, natural wood",
    dimensions: "Stable: 12\" × 8\" × 10\"",
  },
  {
    id: "6",
    name: "Poinsettia Wreath",
    slug: "poinsettia-wreath",
    category: "holiday-decor",
    price: 899,
    description: "A lush artificial poinsettia wreath with red velvet flowers and green foliage. Hang it on your door to welcome guests with holiday cheer.",
    fullDescription: "Welcome guests with the classic beauty of poinsettias — the flower of Christmas. This premium artificial wreath features lifelike red velvet poinsettia blooms, rich green foliage, and subtle gold berry accents.\n\nThe sturdy wire base holds its shape beautifully and comes with a built-in hanging loop. Suitable for indoor and sheltered outdoor display.\n\nDiameter: 18 inches. Looks stunning on front doors, mantels, or as a table centerpiece.",
    sizes: ['14"', '18"'],
    images: [],
    inStock: true,
    stockCount: 22,
    materials: "Silk flowers, plastic foliage, wire frame",
    dimensions: '14" / 18" diameter',
  },
  {
    id: "7",
    name: "Bamboo Star Tree Topper",
    slug: "bamboo-star-tree-topper",
    category: "holiday-decor",
    price: 599,
    description: "A minimalist bamboo star tree topper with warm LED backlight. Adds a distinctly Filipino touch to your Christmas tree.",
    fullDescription: "Crown your Christmas tree with this beautifully minimalist bamboo star topper. Handwoven from natural bamboo strips, it celebrates Filipino craftsmanship and sustainability.\n\nThe built-in warm LED backlight creates a soft halo effect, making the star glow like the Star of Bethlehem. Simple push-fit base fits standard tree top branches.\n\nA modern, eco-friendly alternative to plastic tree toppers.",
    sizes: ["Standard"],
    images: [],
    inStock: true,
    stockCount: 30,
    materials: "Natural bamboo, LED backlight",
    dimensions: '10" × 10"',
  },
  {
    id: "8",
    name: "LED Curtain Lights",
    slug: "led-curtain-lights",
    category: "lights",
    price: 799,
    priceRange: [799, 1499],
    description: "Cascading warm white LED curtain lights perfect for windows, walls, or as a dazzling backdrop for your holiday celebrations.",
    fullDescription: "Transform any wall or window into a shimmering curtain of light. These cascading warm white LED curtain lights create a stunning waterfall effect that's perfect for holiday entertaining.\n\n300 LEDs arranged on 10 vertical strands with 8 lighting modes (steady, flash, wave, fade, and more). Includes remote control for easy mode switching and brightness adjustment.\n\nConnectable design lets you extend up to 3 sets for wider coverage. Indoor/outdoor rated (IP44).",
    sizes: ["2m × 2m (300 LEDs)", "3m × 3m (600 LEDs)"],
    images: [],
    badge: "Free shipping",
    inStock: true,
    stockCount: 40,
    materials: "PVC wire, LED bulbs, remote control",
    dimensions: "2m × 2m / 3m × 3m",
  },
  {
    id: "9",
    name: "Mini Capiz Parol Set",
    slug: "mini-capiz-parol-set",
    category: "parols",
    price: 699,
    description: "A set of 3 mini capiz parols perfect for table displays, tree ornaments, or garland accents. Each parol is handcrafted with natural capiz shells.",
    fullDescription: "Bring the charm of the Filipino parol to every corner of your home with this delightful set of 3 mini capiz parols. Each mini parol is handcrafted with natural capiz shells in the traditional star shape.\n\nPerfect as Christmas tree ornaments, table centerpiece accents, or strung together as a unique garland. Each parol measures 4 inches and comes with a hanging loop and optional LED tea light insert.\n\nA wonderful gift idea that shares the spirit of Filipino Christmas.",
    sizes: ["Set of 3"],
    images: [],
    inStock: true,
    stockCount: 45,
    materials: "Capiz shells, bamboo frame, LED tea lights",
    dimensions: '4" diameter each',
  },
];

export const categories = [
  { value: "all", label: "All" },
  { value: "parols", label: "Parols" },
  { value: "lights", label: "Lights" },
  { value: "holiday-decor", label: "Holiday Decor" },
] as const;

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function formatPrice(price: number): string {
  return `₱${price.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
}
