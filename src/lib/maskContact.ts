/** Mask email like ka******@yahoo.com */
export function maskEmail(email: string | undefined): string {
  if (!email) return "";
  const [local, domain] = email.split("@");
  if (!domain) return email;
  const vis = local.slice(0, Math.min(2, local.length));
  return `${vis}${"*".repeat(Math.max(4, local.length - vis.length))}@${domain}`;
}

/** Mask phone like *********05 */
export function maskPhone(phone: string | undefined): string {
  if (!phone?.trim()) return "";
  const d = phone.replace(/\D/g, "");
  if (d.length <= 2) return "•".repeat(6) + d;
  return "•".repeat(Math.max(6, d.length - 2)) + d.slice(-2);
}
