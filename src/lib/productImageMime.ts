/** MIME types browsers may send for product photos. */
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/pjpeg", // legacy IE / some Windows pickers
]);

const ALLOWED_EXT = new Set(["jpg", "jpeg", "png", "webp"]);

export function inferProductImageMime(file: File): string {
  const mt = (file.type || "").toLowerCase().trim();
  if (mt && ALLOWED_MIME.has(mt)) {
    if (mt === "image/jpg") return "image/jpeg";
    return mt;
  }
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  return mt || "application/octet-stream";
}

export function isAllowedProductImageFile(file: File): boolean {
  const mt = (file.type || "").toLowerCase().trim();
  if (mt && ALLOWED_MIME.has(mt)) return true;
  const ext = file.name.split(".").pop()?.toLowerCase();
  return !!(ext && ALLOWED_EXT.has(ext));
}
