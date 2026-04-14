/**
 * Seeds the products catalogue into Supabase.
 * Run: node scripts/seed-products.mjs
 * Requires in .env: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const envPath = join(__dirname, "..", ".env");
  if (!existsSync(envPath)) {
    console.warn(".env not found. Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the environment.");
    return;
  }
  const content = readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const eq = trimmed.indexOf("=");
      if (eq > 0) {
        const key = trimmed.slice(0, eq).trim();
        const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
        if (!process.env[key]) process.env[key] = value;
      }
    }
  }
}

loadEnv();

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error("Missing VITE_SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const products = [
  {
    id: "1",
    name: "Capiz Star Parol",
    slug: "capiz-star-parol",
    category: "parols",
    price: 1499,
    price_range_min: 1499,
    price_range_max: 2899,
    size_prices: { '12"': 1499, '18"': 1999, '24"': 2899 },
    description: "A traditional Filipino star lantern handcrafted with genuine capiz shells. Illuminates beautifully when lit, casting a warm, pearlescent glow throughout your home.",
    full_description: "The Capiz Star Parol is the quintessential Filipino Christmas lantern, handcrafted by skilled artisans in Pampanga. Each parol features genuine capiz shells carefully arranged in a radiant star pattern. When illuminated, the capiz shells create a mesmerizing pearlescent glow that fills any room with warmth and holiday spirit.\n\nEach piece is unique, with slight natural variations in the capiz shells that add to its artisanal charm. The frame is made from durable bamboo strips, ensuring the parol maintains its shape season after season.\n\nIncludes LED bulb and 3-meter cord with switch.",
    sizes: ['12"', '18"', '24"'],
    images: [],
    badge: "Bestseller",
    in_stock: true,
    stock_count: 24,
    materials: "Capiz shells, bamboo frame, LED bulb",
    dimensions: '12" / 18" / 24" diameter',
    sort_order: 1,
  },
  {
    id: "2",
    name: "Giant Cathedral Parol",
    slug: "giant-cathedral-parol",
    category: "parols",
    price: 3499,
    price_range_min: null,
    price_range_max: null,
    size_prices: null,
    description: "An impressive large-scale parol inspired by the grand lanterns of San Fernando. Features intricate cut-out patterns and warm LED lighting.",
    full_description: "Inspired by the legendary Giant Lantern Festival of San Fernando, Pampanga, this Cathedral Parol brings the grandeur of the festival into your home. The intricate geometric cut-out patterns cast dramatic shadow play on surrounding walls when illuminated.\n\nMade with premium-grade materials and fitted with energy-efficient warm LED lights that last throughout the season. Comes with a sturdy hanging kit suitable for both indoor and outdoor display.\n\nA true statement piece for your Filipino Christmas celebration.",
    sizes: ['36"', '48"'],
    images: [],
    badge: "New arrival",
    in_stock: true,
    stock_count: 8,
    materials: "Acetate, wire frame, warm LED strip",
    dimensions: '36" / 48" diameter',
    sort_order: 2,
  },
  {
    id: "3",
    name: "Warm White Fairy Lights",
    slug: "warm-white-fairy-lights",
    category: "lights",
    price: 349,
    price_range_min: null,
    price_range_max: null,
    size_prices: null,
    description: "Delicate copper wire fairy lights with warm white LEDs. Perfect for wrapping around your parol, Christmas tree, or draping along windowsills.",
    full_description: "These enchanting warm white fairy lights add a magical touch to any holiday setup. The ultra-thin copper wire is flexible and easy to shape around trees, mantels, wreaths, or your favorite parol.\n\n100 micro-LED bulbs emit a soft, warm glow that creates an intimate festive atmosphere. Battery-operated with timer function (6 hours on / 18 hours off) for hassle-free use.\n\nWaterproof rating: IP44 — suitable for indoor and covered outdoor use.",
    sizes: ["5m (50 LEDs)", "10m (100 LEDs)"],
    images: [],
    badge: null,
    in_stock: true,
    stock_count: 56,
    materials: "Copper wire, micro-LED",
    dimensions: "5m or 10m length",
    sort_order: 3,
  },
  {
    id: "4",
    name: "Multicolor Rice Lights",
    slug: "multicolor-rice-lights",
    category: "lights",
    price: 199,
    price_range_min: null,
    price_range_max: null,
    size_prices: null,
    description: "Classic multicolor rice lights, a staple of every Filipino Christmas. Brings nostalgic charm to any indoor or outdoor space.",
    full_description: "Nothing says Pasko like the cheerful glow of multicolor rice lights! These classic Filipino Christmas lights come in vivid red, green, blue, yellow, and orange — perfect for that nostalgic holiday look.\n\nEach strand features 100 durable rice bulbs with end-to-end connectors, so you can link up to 5 strands for larger displays. Indoor/outdoor rated with a sturdy waterproof plug.\n\nA must-have for every Filipino home during the holidays.",
    sizes: ["5m", "10m", "20m"],
    images: [],
    badge: "Holiday sale",
    in_stock: true,
    stock_count: 120,
    materials: "PVC wire, rice bulbs",
    dimensions: "5m / 10m / 20m length",
    sort_order: 4,
  },
  {
    id: "5",
    name: "Nativity Set (Belen)",
    slug: "nativity-set-belen",
    category: "holiday-decor",
    price: 2199,
    price_range_min: null,
    price_range_max: null,
    size_prices: null,
    description: "A beautifully hand-painted resin nativity set featuring the Holy Family, Three Kings, shepherd, and animals. A centerpiece of Filipino Christmas tradition.",
    full_description: "This exquisite Nativity Set (Belen) captures the heart of the Filipino Christmas — the birth of Jesus. Each figure is meticulously hand-painted with warm, earthy tones and delicate gold accents.\n\nThe set includes 11 pieces: the Holy Family (Mary, Joseph, Baby Jesus), Three Kings, an angel, a shepherd, and three animals (donkey, cow, sheep). The stable/manger is crafted from natural wood with a thatched roof.\n\nA timeless centerpiece that tells the story of Christmas for generations to come.",
    sizes: ["Standard (8-piece)", "Deluxe (11-piece)"],
    images: [],
    badge: null,
    in_stock: true,
    stock_count: 15,
    materials: "Hand-painted resin, natural wood",
    dimensions: 'Stable: 12" × 8" × 10"',
    sort_order: 5,
  },
  {
    id: "6",
    name: "Poinsettia Wreath",
    slug: "poinsettia-wreath",
    category: "holiday-decor",
    price: 899,
    price_range_min: null,
    price_range_max: null,
    size_prices: null,
    description: "A lush artificial poinsettia wreath with red velvet flowers and green foliage. Hang it on your door to welcome guests with holiday cheer.",
    full_description: "Welcome guests with the classic beauty of poinsettias — the flower of Christmas. This premium artificial wreath features lifelike red velvet poinsettia blooms, rich green foliage, and subtle gold berry accents.\n\nThe sturdy wire base holds its shape beautifully and comes with a built-in hanging loop. Suitable for indoor and sheltered outdoor display.\n\nDiameter: 18 inches. Looks stunning on front doors, mantels, or as a table centerpiece.",
    sizes: ['14"', '18"'],
    images: [],
    badge: null,
    in_stock: true,
    stock_count: 22,
    materials: "Silk flowers, plastic foliage, wire frame",
    dimensions: '14" / 18" diameter',
    sort_order: 6,
  },
  {
    id: "7",
    name: "Bamboo Star Tree Topper",
    slug: "bamboo-star-tree-topper",
    category: "holiday-decor",
    price: 599,
    price_range_min: null,
    price_range_max: null,
    size_prices: null,
    description: "A minimalist bamboo star tree topper with warm LED backlight. Adds a distinctly Filipino touch to your Christmas tree.",
    full_description: "Crown your Christmas tree with this beautifully minimalist bamboo star topper. Handwoven from natural bamboo strips, it celebrates Filipino craftsmanship and sustainability.\n\nThe built-in warm LED backlight creates a soft halo effect, making the star glow like the Star of Bethlehem. Simple push-fit base fits standard tree top branches.\n\nA modern, eco-friendly alternative to plastic tree toppers.",
    sizes: ["Standard"],
    images: [],
    badge: null,
    in_stock: true,
    stock_count: 30,
    materials: "Natural bamboo, LED backlight",
    dimensions: '10" × 10"',
    sort_order: 7,
  },
  {
    id: "8",
    name: "LED Curtain Lights",
    slug: "led-curtain-lights",
    category: "lights",
    price: 799,
    price_range_min: 799,
    price_range_max: 1499,
    size_prices: { "2m × 2m (300 LEDs)": 799, "3m × 3m (600 LEDs)": 1499 },
    description: "Cascading warm white LED curtain lights perfect for windows, walls, or as a dazzling backdrop for your holiday celebrations.",
    full_description: "Transform any wall or window into a shimmering curtain of light. These cascading warm white LED curtain lights create a stunning waterfall effect that's perfect for holiday entertaining.\n\n300 LEDs arranged on 10 vertical strands with 8 lighting modes (steady, flash, wave, fade, and more). Includes remote control for easy mode switching and brightness adjustment.\n\nConnectable design lets you extend up to 3 sets for wider coverage. Indoor/outdoor rated (IP44).",
    sizes: ["2m × 2m (300 LEDs)", "3m × 3m (600 LEDs)"],
    images: [],
    badge: "Free shipping",
    in_stock: true,
    stock_count: 40,
    materials: "PVC wire, LED bulbs, remote control",
    dimensions: "2m × 2m / 3m × 3m",
    sort_order: 8,
  },
  {
    id: "9",
    name: "Mini Capiz Parol Set",
    slug: "mini-capiz-parol-set",
    category: "parols",
    price: 699,
    price_range_min: null,
    price_range_max: null,
    size_prices: null,
    description: "A set of 3 mini capiz parols perfect for table displays, tree ornaments, or garland accents. Each parol is handcrafted with natural capiz shells.",
    full_description: "Bring the charm of the Filipino parol to every corner of your home with this delightful set of 3 mini capiz parols. Each mini parol is handcrafted with natural capiz shells in the traditional star shape.\n\nPerfect as Christmas tree ornaments, table centerpiece accents, or strung together as a unique garland. Each parol measures 4 inches and comes with a hanging loop and optional LED tea light insert.\n\nA wonderful gift idea that shares the spirit of Filipino Christmas.",
    sizes: ["Set of 3"],
    images: [],
    badge: null,
    in_stock: true,
    stock_count: 45,
    materials: "Capiz shells, bamboo frame, LED tea lights",
    dimensions: '4" diameter each',
    sort_order: 9,
  },
];

async function main() {
  console.log("Seeding products…\n");
  const { data, error } = await supabase
    .from("products")
    .upsert(products, { onConflict: "id" })
    .select("id, name");

  if (error) {
    console.error("Upsert failed:", error.message);
    process.exit(1);
  }

  console.log(`Upserted ${data.length} products:`);
  data.forEach(({ id, name }) => console.log(`  [${id}] ${name}`));
  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
