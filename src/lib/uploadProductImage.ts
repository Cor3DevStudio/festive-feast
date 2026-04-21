import { supabase } from "@/lib/supabase";
import { inferProductImageMime, isAllowedProductImageFile } from "@/lib/productImageMime";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB per image

export function validateProductImageFile(file: File): string | null {
  if (file.size > MAX_BYTES) return "Each image must be at most 5 MB.";
  if (!isAllowedProductImageFile(file)) {
    return "Use a JPEG, PNG, or WebP file (.jpg, .jpeg, .png, .webp). Some browsers omit file type; the extension must match.";
  }
  return null;
}

/**
 * Uploads to Storage bucket `product-images` at `{userId}/{uuid}.{ext}`.
 * Requires `product-images` storage from `supabase/schema.sql` and an admin session.
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

  const contentType = inferProductImageMime(file);

  const { error: upErr } = await supabase.storage.from("product-images").upload(path, file, {
    upsert: false,
    contentType,
  });

  if (upErr) {
    console.error("uploadProductImageFile:", upErr);
    const status =
      typeof (upErr as { statusCode?: string | number }).statusCode !== "undefined"
        ? ` [${(upErr as { statusCode?: string | number }).statusCode}]`
        : "";
    const raw = `${upErr.message ?? "Upload failed"}${status}`;
    if (raw.toLowerCase().includes("bucket") && raw.toLowerCase().includes("not found")) {
      return {
        url: null,
        error:
          "Product image storage is not set up yet. In Supabase SQL Editor, run supabase/schema.sql (Storage → product-images), or supabase/patch_app_user_is_admin.sql if the bucket already exists.",
      };
    }
    if (raw.includes("schema") || raw.includes("incompatible") || raw.includes("PGRST")) {
      return {
        url: null,
        error: `${raw} — In Supabase SQL Editor, run supabase/patch_app_user_is_admin.sql (fixes Storage RLS admin check), then try again.`,
      };
    }
    return { url: null, error: raw };
  }

  const { data } = supabase.storage.from("product-images").getPublicUrl(path);
  return { url: data.publicUrl, error: null };
}
