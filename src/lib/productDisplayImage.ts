import type { Product } from "@/data/products";
import { getProductImage } from "@/data/productImages";

function firstRemoteImageUrl(images: string[] | null | undefined): string | null {
  if (!Array.isArray(images) || images.length === 0) return null;
  for (const raw of images) {
    const s = String(raw).trim();
    if (/^https?:\/\//i.test(s)) return s;
  }
  return null;
}

/**
 * Prefer `product.images` from Supabase (public URLs); fall back to bundled demo art by id.
 */
export function getProductDisplayImageUrl(product: Pick<Product, "id" | "images">): string {
  return firstRemoteImageUrl(product.images) ?? getProductImage(product.id);
}

/** When only `product_id` is known (e.g. order line), resolve from catalog when loaded. */
export function getProductDisplayImageUrlById(
  productId: string,
  getProductById: (id: string) => Product | undefined,
): string {
  const p = getProductById(String(productId));
  if (p) return getProductDisplayImageUrl(p);
  return getProductImage(String(productId));
}
