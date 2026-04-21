/**
 * Bundled placeholder images keyed by legacy demo product id.
 * Storefront prefers `Product.images` from the database; this map is only a fallback.
 */
import productParol1 from "@/assets/product-parol-1.jpg";
import productParol2 from "@/assets/product-parol-2.jpg";
import productParol3 from "@/assets/product-parol-3.jpg";
import productLights1 from "@/assets/product-lights-1.jpg";
import productLights2 from "@/assets/product-lights-2.jpg";
import productLights3 from "@/assets/product-lights-3.jpg";
import productDecor1 from "@/assets/product-decor-1.jpg";
import productDecor2 from "@/assets/product-decor-2.jpg";
import productDecor3 from "@/assets/product-decor-3.jpg";

const imageMap: Record<string, string> = {
  "1": productParol1,
  "2": productParol2,
  "3": productLights1,
  "4": productLights2,
  "5": productDecor1,
  "6": productDecor2,
  "7": productDecor3,
  "8": productLights3,
  "9": productParol3,
};

export function getProductImage(productId: string): string {
  return imageMap[productId] || productParol1;
}
