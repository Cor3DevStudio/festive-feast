import { supabase } from "@/lib/supabase";

export interface CreateQrPhPaymentParams {
  order_id: string;
  amount_cents: number;
  billing: {
    name: string;
    email: string;
    phone?: string;
    street?: string;
    city?: string;
    province?: string;
    postalCode?: string;
  };
}

export interface CreateQrPhPaymentResult {
  payment_intent_id: string;
  qr_image_url: string | null;
  order_id: string;
}

function parseQrPhResponse(
  result: unknown
): { data: CreateQrPhPaymentResult | null; error: Error | null } {
  const r = result as CreateQrPhPaymentResult | { error?: string } | null;
  if (r && typeof r === "object" && "error" in r && r.error) {
    return { data: null, error: new Error(String(r.error)) };
  }
  if (!r || typeof r !== "object" || !("qr_image_url" in r)) {
    return { data: null, error: new Error("Invalid response") };
  }
  return { data: r as CreateQrPhPaymentResult, error: null };
}

/**
 * Creates a QR Ph payment via create-qrph-payment Edge Function.
 * - In dev: use `supabase.functions.invoke` (not the Vite proxy). The proxy can strip
 *   `Authorization` / `apikey`, which causes 401 from Supabase. The client adds
 *   `apikey` automatically and we set `Authorization` to the user JWT.
 * - In production: `/api/create-qrph-payment` (Vercel) forwards with service role + user_id.
 */
export async function createQrPhPayment(
  params: CreateQrPhPaymentParams
): Promise<{ data: CreateQrPhPaymentResult | null; error: Error | null }> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) {
    return { data: null, error: new Error("Not authenticated") };
  }

  if (import.meta.env.DEV) {
    const { data, error } = await supabase.functions.invoke("create-qrph-payment", {
      body: params,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (error) {
      return { data: null, error: new Error(error.message ?? "Request failed") };
    }

    const result = data as CreateQrPhPaymentResult | { error?: string } | null;
    return parseQrPhResponse(result);
  }

  const bearer = `Bearer ${token}`;
  const res = await fetch("/api/create-qrph-payment", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: bearer,
      "X-Authorization": bearer,
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
  return parseQrPhResponse(result);
}

export interface CheckQrPhPaymentResult {
  paid: boolean;
  source?: string;
  payment_intent_status?: string;
}

async function fallbackOrderPaidStatus(
  orderId: string
): Promise<{ data: CheckQrPhPaymentResult | null; error: Error | null }> {
  const { data: order, error } = await supabase
    .from("orders")
    .select("status")
    .eq("id", orderId)
    .maybeSingle();

  if (error) {
    return { data: null, error: new Error(error.message ?? "Failed to read order status") };
  }
  if (!order) {
    return { data: null, error: new Error("Order not found") };
  }

  return {
    data: {
      paid: order.status === "paid",
      source: "order-fallback",
      payment_intent_status: order.status === "paid" ? "succeeded" : undefined,
    },
    error: null,
  };
}

function parseCheckResponse(
  result: unknown
): { data: CheckQrPhPaymentResult | null; error: Error | null } {
  const r = result as
    | CheckQrPhPaymentResult
    | { error?: string; paid?: boolean; payment_intent_status?: string; source?: string }
    | null;
  if (r && typeof r === "object" && "error" in r && r.error) {
    return { data: null, error: new Error(String(r.error)) };
  }
  if (!r || typeof r !== "object" || typeof (r as CheckQrPhPaymentResult).paid !== "boolean") {
    return { data: null, error: new Error("Invalid response") };
  }
  return { data: r as CheckQrPhPaymentResult, error: null };
}

/**
 * Polls PayMongo payment intent (via Edge Function) so the UI can detect when the customer has paid.
 * Works together with the `paymongo-webhook` (either can mark the order paid first).
 */
export async function checkQrPhPayment(
  orderId: string
): Promise<{ data: CheckQrPhPaymentResult | null; error: Error | null }> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) {
    return { data: null, error: new Error("Not authenticated") };
  }

  try {
    if (import.meta.env.DEV) {
      const { data, error } = await supabase.functions.invoke("check-qrph-payment", {
        body: { order_id: orderId },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (error) {
        return fallbackOrderPaidStatus(orderId);
      }
      return parseCheckResponse(data);
    }

    const bearer = `Bearer ${token}`;
    const res = await fetch("/api/check-qrph-payment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: bearer,
        "X-Authorization": bearer,
      },
      body: JSON.stringify({ order_id: orderId }),
    });

    const result = (await res.json().catch(() => ({}))) as CheckQrPhPaymentResult | { error?: string };
    if (!res.ok) {
      return fallbackOrderPaidStatus(orderId);
    }
    return parseCheckResponse(result);
  } catch {
    return fallbackOrderPaidStatus(orderId);
  }
}
