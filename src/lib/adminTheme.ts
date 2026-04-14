/**
 * Admin UI toggles Tailwind `dark` on <html> for the dashboard. The storefront
 * uses light :root tokens by default — remove `dark` when leaving admin so the
 * public site does not stay in admin dark mode after sign-out.
 */
export function restoreStorefrontTheme(): void {
  document.documentElement.classList.remove("dark");
}
