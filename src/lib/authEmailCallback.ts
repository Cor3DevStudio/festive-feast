import { supabase } from "@/lib/supabase";

function hasEmailCallbackPayload(href: string): boolean {
  try {
    const url = new URL(href);
    if (url.searchParams.has("code")) return true;
    const hp = new URLSearchParams(url.hash.startsWith("#") ? url.hash.slice(1) : "");
    if (hp.get("error") || hp.get("error_description")) return true;
    return Boolean(hp.get("access_token") && hp.get("refresh_token"));
  } catch {
    return false;
  }
}

/**
 * Finishes email confirmation / magic-link sign-in when Supabase redirects with
 * ?code= (PKCE) or #access_token=… (implicit). No-op if neither is present.
 */
export async function establishSessionFromEmailCallbackUrl(
  href: string,
): Promise<{ attempted: boolean; ok: boolean; error: string | null }> {
  if (!hasEmailCallbackPayload(href)) {
    return { attempted: false, ok: false, error: null };
  }

  try {
    const url = new URL(href);
    const code = url.searchParams.get("code");
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(href);
      if (error) return { attempted: true, ok: false, error: error.message };
      return { attempted: true, ok: true, error: null };
    }

    const hp = new URLSearchParams(url.hash.startsWith("#") ? url.hash.slice(1) : "");
    const oauthErr = hp.get("error_description") || hp.get("error");
    if (oauthErr) {
      return { attempted: true, ok: false, error: decodeURIComponent(oauthErr.replace(/\+/g, " ")) };
    }
    const access_token = hp.get("access_token");
    const refresh_token = hp.get("refresh_token");
    if (access_token && refresh_token) {
      const { error } = await supabase.auth.setSession({ access_token, refresh_token });
      if (error) return { attempted: true, ok: false, error: error.message };
      return { attempted: true, ok: true, error: null };
    }

    return { attempted: true, ok: false, error: "Missing tokens in confirmation link." };
  } catch (e) {
    return {
      attempted: true,
      ok: false,
      error: e instanceof Error ? e.message : "Invalid confirmation link.",
    };
  }
}

/** Removes ?code=… or OAuth hash so refresh does not re-run a consumed callback. */
export function stripAuthCallbackFromBrowserUrl(): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  let changed = false;
  if (url.searchParams.has("code")) {
    url.searchParams.delete("code");
    changed = true;
  }
  const hash = url.hash;
  if (hash && (hash.includes("access_token") || hash.includes("error_description"))) {
    url.hash = "";
    changed = true;
  }
  if (!changed) return;
  const qs = url.searchParams.toString();
  window.history.replaceState({}, document.title, `${url.pathname}${qs ? `?${qs}` : ""}`);
}
