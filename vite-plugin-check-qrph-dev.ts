import type { Plugin } from "vite";
import type { IncomingMessage, ServerResponse } from "node:http";
import { createClient } from "@supabase/supabase-js";

/**
 * In dev, Vite does not run Vercel `api/*.ts`, so POST /api/check-qrph-payment would 404.
 * This mirrors api/check-qrph-payment.ts: validates JWT, then calls the Edge Function with service role.
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env (same as Vercel).
 */
function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c: Buffer) => chunks.push(Buffer.from(c)));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

export function checkQrPhDevProxy(env: Record<string, string>): Plugin {
  return {
    name: "check-qrph-dev-proxy",
    configureServer(server) {
      server.middlewares.use(async (req, res: ServerResponse, next) => {
        const pathOnly = req.url?.split("?")[0] ?? "";
        if (pathOnly !== "/api/check-qrph-payment") {
          next();
          return;
        }

        if (req.method === "OPTIONS") {
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
          res.setHeader(
            "Access-Control-Allow-Headers",
            "authorization, x-authorization, content-type"
          );
          res.statusCode = 204;
          res.end();
          return;
        }

        if (req.method !== "POST") {
          res.statusCode = 405;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "Method not allowed" }));
          return;
        }

        const SUPABASE_URL = env.VITE_SUPABASE_URL?.replace(/\/$/, "");
        const ANON = env.VITE_SUPABASE_ANON_KEY;
        const SR = env.SUPABASE_SERVICE_ROLE_KEY;

        if (!SUPABASE_URL || !ANON || !SR) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(
            JSON.stringify({
              error:
                "Dev: add SUPABASE_SERVICE_ROLE_KEY to .env (server-only; same as Vercel api/check-qrph-payment).",
            })
          );
          return;
        }

        let raw: string;
        try {
          raw = await readBody(req);
        } catch {
          res.statusCode = 400;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "Bad request" }));
          return;
        }

        let body: Record<string, unknown>;
        try {
          body = JSON.parse(raw || "{}");
        } catch {
          res.statusCode = 400;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "Invalid JSON" }));
          return;
        }

        const authHeader =
          (req.headers["x-authorization"] as string | undefined) ??
          (req.headers.authorization as string | undefined);
        const token = authHeader?.replace(/^Bearer\s+/i, "").trim();
        if (!token) {
          res.statusCode = 401;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "Missing authorization" }));
          return;
        }

        const supabase = createClient(SUPABASE_URL, ANON);
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser(token);
        if (userError || !user) {
          res.statusCode = 401;
          res.setHeader("Content-Type", "application/json");
          res.end(
            JSON.stringify({
              error: userError?.message?.includes("JWT")
                ? "Invalid or expired session. Please log in again."
                : "Unauthorized",
            })
          );
          return;
        }

        const fnRes = await fetch(`${SUPABASE_URL}/functions/v1/check-qrph-payment`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${SR}`,
            apikey: ANON,
          },
          body: JSON.stringify({ ...body, user_id: user.id }),
        });

        const text = await fnRes.text();
        res.setHeader("Content-Type", "application/json");
        res.statusCode = fnRes.status;
        res.end(text);
      });
    },
  };
}
