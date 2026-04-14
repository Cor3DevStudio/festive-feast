import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import type { Product } from "@/data/products";

/** Matches JSON stored in `products.variants` (jsonb array). */
interface DbVariant {
  price?: number;
  size_inches?: number;
  stock_quantity?: number;
  size?: string;
}

/** URL-safe slug from name when DB `slug` is empty. */
function slugify(name: string, fallbackId: string): string {
  const s = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s || String(fallbackId);
}

interface DbProductRow {
  /** Supabase may return numeric ids from json/jsonb-heavy rows; normalize to string at map time. */
  id: string | number;
  name: string;
  slug?: string | null;
  /** When null/undefined, treat as visible (matches RLS `coalesce(is_hidden, false)`). */
  is_hidden?: boolean | null;
  category: string;
  price: number | null;
  price_range_min: number | null;
  price_range_max: number | null;
  size_prices: Record<string, number> | null;
  /** When set, prices/sizes are read from here (your DB shape). */
  variants?: DbVariant[] | null;
  description: string;
  full_description: string;
  sizes: string[] | null;
  images: string[] | null;
  badge: string | null;
  in_stock: boolean;
  stock_count: number | null;
  materials: string | null;
  dimensions: string | null;
}

/**
 * Maps `variants` jsonb → Product price fields.
 * Example row: [{"price":1800,"size_inches":0,"stock_quantity":6}]
 */
function deriveFromVariants(variants: DbVariant[] | null | undefined): {
  price: number;
  priceRange?: [number, number];
  sizePrices?: Record<string, number>;
  sizes: string[];
  stockCount?: number;
} | null {
  if (!variants?.length) return null;

  const valid = variants.filter(
    (v) => typeof v.price === "number" && !Number.isNaN(v.price)
  );
  if (!valid.length) return null;

  const prices = valid.map((v) => v.price as number);
  const minP = Math.min(...prices);
  const maxP = Math.max(...prices);

  const sizePrices: Record<string, number> = {};
  const sizes: string[] = [];
  let totalStock = 0;

  valid.forEach((v, i) => {
    const p = v.price as number;
    let label: string;
    if (typeof v.size === "string" && v.size.trim()) {
      label = v.size.trim();
    } else if (typeof v.size_inches === "number" && v.size_inches > 0) {
      label = `${v.size_inches}"`;
    } else if (valid.length === 1) {
      label = "Standard";
    } else {
      label = `Option ${i + 1}`;
    }
    let key = label;
    let n = 2;
    while (key in sizePrices) {
      key = `${label} (${n})`;
      n++;
    }
    sizePrices[key] = p;
    sizes.push(key);
    if (typeof v.stock_quantity === "number") totalStock += v.stock_quantity;
  });

  return {
    price: minP,
    priceRange: minP !== maxP ? [minP, maxP] : undefined,
    sizePrices: Object.keys(sizePrices).length ? sizePrices : undefined,
    sizes,
    stockCount: totalStock > 0 ? totalStock : undefined,
  };
}

function rowToProduct(row: DbProductRow): Product {
  const fromVariants = deriveFromVariants(row.variants ?? undefined);

  const legacyPrice =
    typeof row.price === "number" && !Number.isNaN(row.price) && row.price > 0 ? row.price : null;

  const normalizedPrice = fromVariants?.price ?? legacyPrice ?? 0;

  const priceRange =
    fromVariants?.priceRange ??
    (row.price_range_min != null && row.price_range_max != null
      ? [row.price_range_min, row.price_range_max]
      : undefined);

  const sizePrices = fromVariants?.sizePrices ?? row.size_prices ?? undefined;

  const sizesArr = row.sizes ?? [];
  const sizes =
    fromVariants && fromVariants.sizes.length > 0
      ? fromVariants.sizes
      : Array.isArray(sizesArr)
        ? sizesArr
        : [];

  const stockCount = fromVariants?.stockCount ?? row.stock_count ?? undefined;

  const slug =
    (typeof row.slug === "string" && row.slug.trim()) || slugify(row.name || "product", String(row.id));

  return {
    id: String(row.id),
    name: row.name,
    slug,
    category: row.category,
    price: normalizedPrice,
    priceRange,
    sizePrices,
    description: row.description ?? "",
    fullDescription: row.full_description ?? "",
    sizes,
    images: row.images ?? [],
    badge: row.badge ?? undefined,
    inStock: row.in_stock,
    stockCount,
    materials: row.materials ?? undefined,
    dimensions: row.dimensions ?? undefined,
  };
}

interface ProductsContextType {
  products: Product[];
  productsLoading: boolean;
  getProductById: (id: string) => Product | undefined;
  getProductBySlug: (slug: string) => Product | undefined;
  refetchProducts: () => Promise<void>;
}

const ProductsContext = createContext<ProductsContextType | undefined>(undefined);

export function ProductsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    setProductsLoading(true);
    // Do not use .eq("is_hidden", false): that excludes rows where is_hidden IS NULL, so the shop
    // stayed empty while RLS still allowed those rows. Admins may receive hidden rows — hide them here.
    const { data, error } = await supabase.from("products").select("*");
    setProductsLoading(false);
    if (error) {
      console.error("Failed to fetch products:", error);
      setProducts([]);
      return;
    }
    const rows = ((data as DbProductRow[]) ?? []).filter((row) => row.is_hidden !== true);
    const mapped = rows.map(rowToProduct);
    mapped.sort((a, b) => a.name.localeCompare(b.name));
    setProducts(mapped);
  }, []);

  /** Refetch when auth identity changes (e.g. admin sign-out → anon) so the storefront reloads with the correct session. */
  useEffect(() => {
    void fetchProducts();
  }, [fetchProducts, user?.id]);

  const getProductById = useCallback(
    (id: string) => products.find((p) => String(p.id) === String(id)),
    [products]
  );

  const getProductBySlug = useCallback((raw: string) => {
    let key = raw;
    try {
      key = decodeURIComponent(raw || "");
    } catch {
      key = raw || "";
    }
    key = key.trim();
    if (!key) return undefined;
    const lower = key.toLowerCase();
    return products.find(
      (p) =>
        p.slug === key ||
        p.slug.toLowerCase() === lower ||
        String(p.id) === String(key) ||
        slugify(p.name, p.id) === lower
    );
  }, [products]);

  return (
    <ProductsContext.Provider
      value={{ products, productsLoading, getProductById, getProductBySlug, refetchProducts: fetchProducts }}
    >
      {children}
    </ProductsContext.Provider>
  );
}

export function useProducts() {
  const ctx = useContext(ProductsContext);
  if (!ctx) throw new Error("useProducts must be used within ProductsProvider");
  return ctx;
}
