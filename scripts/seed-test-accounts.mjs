/**
 * Creates test user accounts in Supabase Auth for testing login, cart, and payment.
 * Run: node scripts/seed-test-accounts.mjs
 * Requires in .env: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const envPath = join(__dirname, "..", ".env");
  if (!existsSync(envPath)) {
    console.warn(".env not found. Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the environment.");
    return;
  }
  const content = readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const eq = trimmed.indexOf("=");
      if (eq > 0) {
        const key = trimmed.slice(0, eq).trim();
        const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
        if (!process.env[key]) process.env[key] = value;
      }
    }
  }
}

loadEnv();

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error("Missing VITE_SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY in .env");
  console.error("Add SUPABASE_SERVICE_ROLE_KEY from Supabase Dashboard → Settings → API → service_role");
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const TEST_ACCOUNTS = [
  { email: "buyer@test.com", password: "TestBuyer123!" },
  { email: "paytest@test.com", password: "PayTest456!" },
];

async function main() {
  console.log("Creating test accounts...\n");
  for (const { email, password } of TEST_ACCOUNTS) {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error) {
      if (error.message.includes("already been registered")) {
        console.log(`  ${email} – already exists (use same password to log in)`);
      } else {
        console.error(`  ${email} – error:`, error.message);
      }
    } else {
      console.log(`  ${email} – created`);
    }
  }
  console.log("\nTest accounts (use these to log in and test payment):");
  console.log("────────────────────────────────────────");
  TEST_ACCOUNTS.forEach(({ email, password }) => console.log(`  ${email}  /  ${password}`));
  console.log("────────────────────────────────────────");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
