/**
 * Vercel serverless proxy for create-qrph-payment Edge Function.
 * Forwards the request with the user's Authorization header and adds the anon key
 * so the Supabase edge gateway accepts the call (fixes 401 from direct client invoke).
 */

const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Max-Age": "86400",
};

export default async function handler(
  req: { method?: string; headers?: { authorization?: string }; body?: unknown },
  res: { setHeader: (k: string, v: string) => void; status: (n: number) => { json: (x: unknown) => void }; end?: () => void }
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

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    res.status(500).json({ error: "Server missing Supabase configuration" });
    return;
  }

  const auth = req.headers?.authorization;
  if (!auth) {
    res.status(401).json({ error: "Missing authorization" });
    return;
  }

  const body = req.body;
  if (body === undefined || body === null) {
    res.status(400).json({ error: "Invalid JSON body" });
    return;
  }

  const url = `${SUPABASE_URL.replace(/\/$/, "")}/functions/v1/create-qrph-payment`;
  const fnRes = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: auth,
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(body),
  });

  const text = await fnRes.text();
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    data = { error: text || "Unknown error" };
  }

  res.setHeader("Content-Type", "application/json");
  res.status(fnRes.status).json(data);
}
