# Migrations folder

All incremental SQL has been **squashed into one file** to avoid drift and confusion:

**[`../schema.sql`](../schema.sql)** — run this in the Supabase **SQL Editor** for new projects or to repair/patch an existing database (it uses `IF NOT EXISTS` / `DROP POLICY IF EXISTS` / `ADD COLUMN IF NOT EXISTS` where appropriate).

This directory intentionally has **no numbered `.sql` migration files**. If you use Supabase CLI `db push` / migration tracking and need versioned migrations again, generate a new migration from your current remote schema or split changes manually from `schema.sql`.

**Upload errors (“invalid schema”, Storage RLS):** run **`supabase/patch_app_user_is_admin.sql`** once (or re-run the full **`schema.sql`**, which now includes the same helper + policies).
