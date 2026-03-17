import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Add them to .env. Use the anon (public) key from Supabase Dashboard → Settings → API, never the service_role key in the frontend."
  );
}

export const supabase = createClient(supabaseUrl ?? "", supabaseAnonKey ?? "");
