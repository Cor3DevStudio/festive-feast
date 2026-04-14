export interface Product {
  id: string;
  name: string;
  slug: string;
  category: string;
  price: number;
  priceRange?: [number, number];
  /** Per-size prices. When present, the detail page shows the exact price after a size is chosen. */
  sizePrices?: Record<string, number>;
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

export const categories = [
  { value: "all", label: "All" },
  { value: "parols", label: "Parols" },
  { value: "lights", label: "Lights" },
  { value: "holiday-decor", label: "Holiday Decor" },
] as const;

export function formatPrice(price: number | null | undefined): string {
  if (typeof price !== "number" || Number.isNaN(price)) return "Price unavailable";
  return `₱${price.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
}
