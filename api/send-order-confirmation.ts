/**
 * Validates the shopper JWT, loads the order with the service role, sends confirmation via Gmail SMTP.
 */
import { createClient } from "@supabase/supabase-js";
import { sendOrderConfirmationViaGmail } from "../lib/orderConfirmationGmail";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-authorization, content-type",
  "Access-Control-Max-Age": "86400",
};

function getAuthHeader(
  headers: Record<string, string | string[] | undefined> | undefined,
): string | undefined {
  if (!headers) return undefined;
  const get = (k: string): string | undefined => {
    const v = headers[k];
    return Array.isArray(v) ? v[0] : v;
  };
  return get("x-authorization") ?? get("authorization") ?? get("Authorization");
}

export default async function handler(
  req: { method?: string; headers?: Record<string, string | string[] | undefined>; body?: unknown },
  res: { setHeader: (k: string, v: string) => void; status: (n: number) => { json: (x: unknown) => void } },
): Promise<void> {
  Object.entries(cors).forEach(([k, v]) => res.setHeader(k, v));

  if (req.method === "OPTIONS") {
    res.status(204).json(null);
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    res.status(500).json({
      error: "Server missing Supabase config (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY)",
    });
    return;
  }

  const auth = getAuthHeader(req.headers);
  const token = auth?.replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    res.status(401).json({ error: "Missing authorization" });
    return;
  }

  const body = req.body as Record<string, unknown> | null | undefined;
  if (!body || typeof body !== "object" || typeof body.order_id !== "string") {
    res.status(400).json({ error: "Invalid JSON body (need order_id)" });
    return;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(token);
  if (userError || !user) {
    res.status(401).json({
      error: userError?.message?.includes("JWT")
        ? "Invalid or expired session. Please log in again."
        : "Unauthorized",
    });
    return;
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const result = await sendOrderConfirmationViaGmail(admin, body.order_id, user.id);

  if ("error" in result) {
    res.status(result.status).json({ error: result.error });
    return;
  }

  res.status(200).json({ ok: true });
}
