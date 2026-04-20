import { supabase } from "@/lib/supabase";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB per image

export function validateProductImageFile(file: File): string | null {
  if (file.size > MAX_BYTES) return "Each image must be at most 5 MB.";
  const ok = ["image/jpeg", "image/png", "image/webp"].includes(file.type);
  if (!ok) return "Use JPEG, PNG, or WebP only.";
  return null;
}

/**
 * Uploads to Storage bucket `product-images` at `{userId}/{uuid}.{ext}`.
 * Requires migration `20260415120000_product_images_bucket.sql` and admin session.
 */
export async function uploadProductImageFile(
  userId: string,
  file: File,
): Promise<{ url: string | null; error: string | null }> {
  const err = validateProductImageFile(file);
  if (err) return { url: null, error: err };

  const ext = file.name.split(".").pop()?.toLowerCase();
  const safeExt = ext === "png" ? "png" : ext === "webp" ? "webp" : "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${safeExt}`;

  const { error: upErr } = await supabase.storage.from("product-images").upload(path, file, {
    upsert: false,
    contentType: file.type || `image/${safeExt === "jpg" ? "jpeg" : safeExt}`,
  });

  if (upErr) {
    console.error("uploadProductImageFile:", upErr);
    return {
      url: null,
      error:
        upErr.message?.includes("Bucket not found") || upErr.message?.includes("not found")
          ? "Product image storage is not set up yet. In Supabase SQL Editor, run migration 20260415120000_product_images_bucket.sql (see repo supabase/migrations)."
          : upErr.message,
    };
  }

  const { data } = supabase.storage.from("product-images").getPublicUrl(path);
  return { url: data.publicUrl, error: null };
}
