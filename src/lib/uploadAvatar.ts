import { supabase } from "@/lib/supabase";

const MAX_BYTES = 1024 * 1024; // 1 MB

export function validateAvatarFile(file: File): string | null {
  if (file.size > MAX_BYTES) return "File size must be at most 1 MB.";
  const ok = ["image/jpeg", "image/png", "image/webp"].includes(file.type);
  if (!ok) return "Use .JPEG, .PNG, or .WEBP only.";
  return null;
}

/** Uploads to bucket `avatars` at `{userId}/avatar.{ext}`. Returns public URL or null. */
export async function uploadAvatarFile(userId: string, file: File): Promise<{ url: string | null; error: string | null }> {
  const err = validateAvatarFile(file);
  if (err) return { url: null, error: err };

  const ext = file.name.split(".").pop()?.toLowerCase();
  const safeExt = ext === "png" ? "png" : ext === "webp" ? "webp" : "jpg";
  const path = `${userId}/avatar.${safeExt}`;

  const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, {
    upsert: true,
    contentType: file.type || `image/${safeExt === "jpg" ? "jpeg" : safeExt}`,
  });

  if (upErr) {
    console.error("uploadAvatarFile:", upErr);
    return {
      url: null,
      error:
        upErr.message?.includes("Bucket not found") || upErr.message?.includes("not found")
          ? "Avatar storage is not set up yet. Run the latest Supabase migration or create the avatars bucket."
          : upErr.message,
    };
  }

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  return { url: data.publicUrl, error: null };
}
