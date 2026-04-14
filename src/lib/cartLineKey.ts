/** Stable key for a cart line (product + size). */
export function cartLineKey(productId: string, size: string): string {
  return `${String(productId)}::${size}`;
}

export function parseCartLineKey(key: string): { productId: string; size: string } | null {
  const sep = "::";
  const i = key.indexOf(sep);
  if (i === -1) return null;
  return { productId: key.slice(0, i), size: key.slice(i + sep.length) };
}
