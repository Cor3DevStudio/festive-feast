export interface CreateQrPhPaymentParams {
  order_id: string;
  amount_cents: number;
  billing: { name: string; email: string; phone?: string; address?: string };
  /** Required: pass session.access_token from AuthContext. getSession() can be null on first load. */
  accessToken: string;
}

export interface CreateQrPhPaymentResult {
  payment_intent_id: string;
  qr_image_url: string | null;
  order_id: string;
}

export async function createQrPhPayment(
  params: CreateQrPhPaymentParams
): Promise<{ data: CreateQrPhPaymentResult | null; error: Error | null }> {
  const { accessToken: token, ...body } = params;
  if (!token) {
    return { data: null, error: new Error("Not authenticated") };
  }

  // In dev, use same-origin proxy to avoid CORS (vite.config server.proxy)
  const base =
    import.meta.env.DEV
      ? ""
      : (import.meta.env.VITE_SUPABASE_URL ?? "");
  const path = import.meta.env.DEV
    ? "/api/supabase-functions/v1/create-qrph-payment"
    : "/functions/v1/create-qrph-payment";
  const url = `${base}${path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (anonKey) headers["apikey"] = anonKey;

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    return {
      data: null,
      error: new Error(json?.error ?? `Request failed (${res.status})`),
    };
  }
  return { data: json as CreateQrPhPaymentResult, error: null };
}
