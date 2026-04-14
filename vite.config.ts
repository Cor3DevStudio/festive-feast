import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { checkQrPhDevProxy } from "./vite-plugin-check-qrph-dev";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const supabaseUrl =
    env.VITE_SUPABASE_URL?.replace(/\/$/, "") || "https://nzlzymypanaeplxemlkw.supabase.co";

  return {
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false,
      },
      proxy: {
        // Same-origin in dev → Vite forwards to Supabase (avoids CORS; preserves Authorization + apikey)
        "/api/supabase-functions": {
          target: supabaseUrl,
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/api\/supabase-functions/, "/functions"),
          configure: (proxy) => {
            proxy.on("proxyReq", (proxyReq, req) => {
              const h = req.headers;
              const auth = h.authorization;
              const key = h.apikey;
              if (auth) proxyReq.setHeader("Authorization", auth);
              if (key) proxyReq.setHeader("apikey", key);
            });
          },
        },
      },
    },
    plugins: [
      react(),
      mode === "development" && componentTagger(),
      mode === "development" && checkQrPhDevProxy(env),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
