import { supabase } from "@/lib/supabase";

/**
 * Triggers order confirmation email (Gmail SMTP via Vercel api/send-order-confirmation;
 * in dev, Vite middleware runs the same logic).
 */
export async function sendOrderConfirmationEmail(orderId: string): Promise<{ error: Error | null }> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) {
    return { error: new Error("Not authenticated") };
  }

  const bearer = `Bearer ${token}`;
  const res = await fetch("/api/send-order-confirmation", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: bearer,
      "X-Authorization": bearer,
    },
    body: JSON.stringify({ order_id: orderId }),
  });

  const result = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) {
    return { error: new Error(result.error ?? `Request failed (${res.status})`) };
  }
  if (result.error) {
    return { error: new Error(result.error) };
  }
  return { error: null };
}
