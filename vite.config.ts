import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    proxy: {
      // Avoid CORS in dev: browser calls same-origin, Vite forwards to Supabase Edge Function
      "/api/supabase-functions": {
        target: "https://nzlzymypanaeplxemlkw.supabase.co",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/supabase-functions/, "/functions"),
        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq, req) => {
            const h = req.headers as Record<string, string>;
            if (h["authorization"]) proxyReq.setHeader("Authorization", h["authorization"]);
            if (h["apikey"]) proxyReq.setHeader("apikey", h["apikey"]);
          });
        },
      },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
