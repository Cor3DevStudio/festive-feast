import type { Plugin } from "vite";
import type { IncomingMessage, ServerResponse } from "node:http";
import { createClient } from "@supabase/supabase-js";
import { sendOrderConfirmationViaGmail, makeEnvGetter } from "./lib/orderConfirmationGmail";

/**
 * In dev, Vite does not run Vercel `api/*.ts`. Mirrors api/send-order-confirmation.ts using Gmail SMTP.
 * Requires in .env: SUPABASE_SERVICE_ROLE_KEY, GMAIL_USER, GMAIL_APP_PASSWORD
 */
function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c: Buffer) => chunks.push(Buffer.from(c)));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

export function sendOrderEmailDevProxy(env: Record<string, string>): Plugin {
  return {
    name: "send-order-email-dev-proxy",
    configureServer(server) {
      server.middlewares.use(async (req, res: ServerResponse, next) => {
        const pathOnly = req.url?.split("?")[0] ?? "";
        if (pathOnly !== "/api/send-order-confirmation") {
          next();
          return;
        }

        if (req.method === "OPTIONS") {
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
          res.setHeader(
            "Access-Control-Allow-Headers",
            "authorization, x-authorization, content-type",
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
                "Dev: add VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY to .env.",
            }),
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
            }),
          );
          return;
        }

        if (typeof body.order_id !== "string") {
          res.statusCode = 400;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "Invalid JSON body (need order_id)" }));
          return;
        }

        const admin = createClient(SUPABASE_URL, SR);
        const getEnv = makeEnvGetter(env);
        const result = await sendOrderConfirmationViaGmail(admin, body.order_id, user.id, getEnv);

        res.setHeader("Content-Type", "application/json");
        if ("error" in result) {
          res.statusCode = result.status;
          res.end(JSON.stringify({ error: result.error }));
          return;
        }
        res.statusCode = 200;
        res.end(JSON.stringify({ ok: true }));
      });
    },
  };
}
