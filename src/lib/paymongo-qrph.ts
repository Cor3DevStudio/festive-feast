import { supabase } from "@/lib/supabase";

export interface CreateQrPhPaymentParams {
  order_id: string;
  amount_cents: number;
  billing: { name: string; email: string; phone?: string; address?: string };
}

export interface CreateQrPhPaymentResult {
  payment_intent_id: string;
  qr_image_url: string | null;
  order_id: string;
}

/**
 * Creates a QR Ph payment via create-qrph-payment Edge Function.
 * - In dev: uses Supabase client invoke (Vite proxy handles CORS).
 * - In production: calls same-origin /api/create-qrph-payment so the server
 *   forwards the request with correct anon key and user JWT (avoids 401).
 */
export async function createQrPhPayment(
  params: CreateQrPhPaymentParams
): Promise<{ data: CreateQrPhPaymentResult | null; error: Error | null }> {
  if (import.meta.env.DEV) {
    const { data, error } = await supabase.functions.invoke("create-qrph-payment", {
      body: params,
    });
    if (error) {
      return { data: null, error: new Error(error.message ?? "Request failed") };
    }
    const result = data as CreateQrPhPaymentResult | { error?: string } | null;
    if (result && "error" in result && result.error) {
      return { data: null, error: new Error(result.error) };
    }
    if (!result || !("qr_image_url" in result)) {
      return { data: null, error: new Error("Invalid response") };
    }
    return { data: result as CreateQrPhPaymentResult, error: null };
  }

  // Production: same-origin proxy so Vercel server adds anon key and forwards JWT
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) {
    return { data: null, error: new Error("Not authenticated") };
  }

  const res = await fetch("/api/create-qrph-payment", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(params),
  });

  const result = (await res.json().catch(() => ({}))) as
    | CreateQrPhPaymentResult
    | { error?: string };
  if (!res.ok) {
    return {
      data: null,
      error: new Error((result as { error?: string }).error ?? `Request failed (${res.status})`),
    };
  }
  if (result && "error" in result && result.error) {
    return { data: null, error: new Error(result.error) };
  }
  if (!result || !("qr_image_url" in result)) {
    return { data: null, error: new Error("Invalid response") };
  }
  return { data: result as CreateQrPhPaymentResult, error: null };
}
