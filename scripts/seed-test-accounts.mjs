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
  { email: "buyer@test.com", password: "TestBuyer123!", isAdmin: false, fullName: "Buyer Test" },
  { email: "paytest@test.com", password: "PayTest456!", isAdmin: false, fullName: "Payment Tester" },
  // Admin logins: same Supabase Auth + /login; profiles.is_admin routes to /admin after sign-in.
  { email: "admin@test.com", password: "AdminTest789!", isAdmin: true, fullName: "Admin Test" },
  { email: "admin2@test.com", password: "AdminTwo890!", isAdmin: true, fullName: "Second Admin" },
  { email: "superadmin@test.com", password: "SuperAdmin901!", isAdmin: true, fullName: "Super Admin" },
];

async function main() {
  console.log("Creating test accounts...\n");
  for (const { email, password, isAdmin, fullName } of TEST_ACCOUNTS) {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    let userId = data?.user?.id;

    if (!userId && error?.message.includes("already been registered")) {
      const { data: usersPage, error: listErr } = await supabase.auth.admin.listUsers({
        page: 1,
        perPage: 200,
      });
      if (!listErr) {
        userId = usersPage?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase())?.id;
      }
    }

    if (userId) {
      const username = email.split("@")[0];
      const { error: profileUpsertError } = await supabase.from("profiles").upsert(
        {
          id: userId,
          full_name: fullName,
          username,
          is_admin: isAdmin,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" },
      );
      if (profileUpsertError) {
        console.error(`  ${email} – failed to upsert profile: ${profileUpsertError.message}`);
      }
    }

    if (error) {
      if (error.message.includes("already been registered")) {
        console.log(`  ${email} – already exists (profile synced)`);
      } else {
        console.error(`  ${email} – error:`, error.message);
      }
    } else {
      console.log(`  ${email} – created${isAdmin ? " (admin)" : ""}`);
    }
  }
  console.log("\nTest accounts (use these to log in and test payment/admin):");
  console.log("────────────────────────────────────────");
  TEST_ACCOUNTS.forEach(({ email, password }) => console.log(`  ${email}  /  ${password}`));
  console.log("────────────────────────────────────────");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
