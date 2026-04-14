# Festive Feast

E-commerce storefront for the Philippines: shop, cart, checkout with **QR Ph** (PayMongo), customer **account** area, and an **admin** console for products and categories. The app is a **React 18 + Vite + TypeScript** SPA using **Supabase** (Auth, Postgres, Row Level Security, Storage) and **TanStack Query**.

---

## Table of contents

1. [Tech stack](#tech-stack)
2. [Prerequisites](#prerequisites)
3. [Quick start](#quick-start)
4. [Environment variables](#environment-variables)
5. [Supabase database](#supabase-database)
6. [Edge functions and PayMongo (QR Ph)](#edge-functions-and-paymongo-qr-ph)
7. [Payment flow: development vs production](#payment-flow-development-vs-production)
8. [Test accounts (seeded users)](#test-accounts-seeded-users)
9. [Other scripts](#other-scripts)
10. [Application routes](#application-routes)
11. [Roles: customer vs admin](#roles-customer-vs-admin)
12. [Build, test, and deploy](#build-test-and-deploy)
13. [Security notes](#security-notes)

---

## Tech stack

| Area | Technology |
|------|------------|
| UI | React 18, React Router 6, Tailwind CSS, Radix UI / shadcn-style components, Framer Motion |
| Data & auth | Supabase JS client (`@supabase/supabase-js`) |
| Serverless API (production) | Vercel `api/*.ts` routes that call Supabase with the service role where needed |
| Payments | PayMongo **QR Ph** via Supabase Edge Functions |
| Local dev server | Vite (default port **8080**, host `::`) |

---

## Prerequisites

- **Node.js** (LTS recommended) and npm
- A **Supabase** project (URL + anon key + service role key from Dashboard → Project Settings → API)
- For real QR Ph: **PayMongo live** secret key (QR Ph does not work with PayMongo test keys)

---

## Quick start

```bash
npm install
```

1. Copy **`.env.example`** to **`.env`** and fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
2. Apply the database steps in [Supabase database](#supabase-database).
3. (Optional but recommended for local payment polling) Add **`SUPABASE_SERVICE_ROLE_KEY`** to `.env` for dev-only middleware—see [Payment flow](#payment-flow-development-vs-production).
4. Seed test users (see [Test accounts](#test-accounts-seeded-users)):

   ```bash
   npm run seed:accounts
   ```

5. Start the dev server:

   ```bash
   npm run dev
   ```

Open the URL Vite prints (typically `http://localhost:8080`).

---

## Environment variables

| Variable | Where | Purpose |
|----------|--------|---------|
| `VITE_SUPABASE_URL` | `.env` (client) | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | `.env` (client) | Public anon key; safe in the browser |
| `VITE_SITE_URL` | `.env` / Vercel (client, optional) | Canonical **https** origin of the live app (no trailing slash), used as `emailRedirectTo` for **sign-up confirmation** emails. If unset, the value is taken from `window.location.origin` when the user submits the form (fine when they sign up on production). |
| `SUPABASE_SERVICE_ROLE_KEY` | `.env` (local only, scripts + Vite dev plugin) | **Never** ship to the client bundle for production users. Used by `scripts/*.mjs`, Vite plugin for `/api/check-qrph-payment` in dev, and should be configured on Vercel for server routes |

**Sign-up confirmation links:** Supabase can fall back to the dashboard **Site URL** (often still `localhost` after local dev). This app sends **`emailRedirectTo`** pointing at **`/login`** on `VITE_SITE_URL` if set, otherwise the browser’s current origin. In Supabase **Authentication → URL Configuration**, set **Site URL** to your production **https** origin and add that origin under **Redirect URLs** (wildcard `https://your-domain.com/**` is fine) so confirmation links are allowed.

PayMongo credentials belong in **Supabase Edge Function secrets**, not in `VITE_*` client env:

```bash
supabase secrets set PAYMONGO_SECRET_KEY=sk_live_...
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...   # if the function needs it
```

---

## Supabase database

1. In the Supabase **SQL Editor**, run **`supabase/schema.sql`** to establish the base schema (including `profiles` with `is_admin`, orders, products-related tables, and RLS patterns used by the app).
2. Apply migrations under **`supabase/migrations/`** in chronological order (filename prefix is the ordering hint).

If an existing project already had an `orders` table **without** shipping columns, apply at least **`20250323150000_orders_shipping_and_payment_columns.sql`** (and related migrations). Missing columns commonly surface as errors such as missing `shipping_city` during checkout.

Without a correct schema and RLS, login, cart persistence, checkout, and admin screens will fail in ways that depend on which tables or policies are missing.

---

## Edge functions and PayMongo (QR Ph)

Relevant Edge Functions under **`supabase/functions/`**:

| Function | Role |
|----------|------|
| `create-qrph-payment` | Creates PayMongo payment intent and QR Ph payload for an order |
| `check-qrph-payment` | Checks payment status (used when polling after showing the QR) |
| `paymongo-webhook` | Handles PayMongo webhooks (keep deployed and URL configured in PayMongo when using webhooks) |

Deploy these to your Supabase project and set secrets as required by each function’s `index.ts`.

**QR Ph requires a PayMongo *live* key.** Test/sandbox keys are not sufficient for QR Ph in the way this integration expects.

---

## Payment flow: development vs production

- **Development (`import.meta.env.DEV`)**  
  - **Create payment:** `createQrPhPayment` uses **`supabase.functions.invoke("create-qrph-payment", …)`** with the logged-in user’s JWT so Supabase auth matches checkout.  
  - **Check payment:** can use `supabase.functions.invoke("check-qrph-payment", …)` or the local **`POST /api/check-qrph-payment`** path. Vite’s **`check-qrph-dev-proxy`** plugin implements that route in dev (mirrors `api/check-qrph-payment.ts`) and needs **`SUPABASE_SERVICE_ROLE_KEY`** in `.env`.  
  - Vite also exposes an optional proxy **`/api/supabase-functions`** → Supabase `/functions`; QR Ph creation intentionally uses direct invoke rather than this proxy so `Authorization` / `apikey` are not stripped.

- **Production**  
  - Create/check flows call **Vercel** routes such as **`/api/create-qrph-payment`** and **`/api/check-qrph-payment`**, which forward to Edge Functions using server-side credentials.

---

## Test accounts (seeded users)

The repo does **not** ship real production users. For **local/staging** Supabase projects, test users are created by:

```bash
npm run seed:accounts
```

Equivalent: `node scripts/seed-test-accounts.mjs`

**Requirements:** `VITE_SUPABASE_URL` and **`SUPABASE_SERVICE_ROLE_KEY`** in `.env`.

The script uses the Admin API to create Auth users (email pre-confirmed) and **upserts `public.profiles`** with `full_name`, `username`, and **`is_admin`**. Re-running is safe: existing emails sync the profile.

| Email | Password | `profiles.is_admin` | Intended use |
|-------|----------|---------------------|----------------|
| `buyer@test.com` | `TestBuyer123!` | `false` | General shopper: cart, checkout, account |
| `paytest@test.com` | `PayTest456!` | `false` | Payment / QR Ph testing |
| `admin@test.com` | `AdminTest789!` | `true` | Admin dashboard, catalog, user role tools |

**After seeding**, sign in at **`/login`**. Admins are sent toward **`/admin`**; customers use the storefront and **`/account/*`**.

> **Warning:** These passwords are public in source control. Use **only** on disposable or development Supabase projects; rotate or delete users before any production launch.

---

## Other scripts

| Command | Script | Purpose |
|---------|--------|---------|
| `node scripts/seed-products.mjs` | `scripts/seed-products.mjs` | Seeds the **products** catalogue into Supabase (same `.env` requirements: URL + service role) |

---

## Application routes

| Path | Description |
|------|-------------|
| `/` | Home |
| `/shop` | Product listing |
| `/product/:slug` | Product detail |
| `/cart` | Cart |
| `/checkout` | Checkout |
| `/login` | Login |
| `/order-success` | Post-order confirmation |
| `/account/orders`, `/account/profile`, `/account/addresses`, `/account/password`, `/account/notifications`, `/account/vouchers`, `/account/rewards` | Customer account |
| `/admin` | Admin dashboard |
| `/admin/items` | Admin product management |
| `/admin/categories` | Admin categories |
| `/about`, `/contact`, `/privacy`, `/terms` | Static/info pages |

---

## Roles: customer vs admin

- **Customer:** any authenticated user. Access to own profile, addresses, orders, etc., is enforced by **RLS** on Supabase tables.
- **Admin:** users whose row in **`public.profiles`** has **`is_admin = true`**. The app shows admin navigation and routes; sensitive writes (products, categories, etc.) must remain protected by **RLS policies** that require `is_admin` (see migrations and `supabase/schema.sql`). Existing admins can toggle other users’ admin flag from the admin UI where implemented.

---

## Build, test, and deploy

```bash
npm run build      # production bundle
npm run preview    # local preview of build
npm run lint       # ESLint
npm run test       # Vitest (once)
npm run test:watch # Vitest watch mode
```

**Deploy:** `npm run deploy` runs Vercel (`vercel --prod --yes`). Ensure production env vars and Supabase secrets match the [Environment variables](#environment-variables) and [Edge functions](#edge-functions-and-paymongo-qr-ph) sections.

---

## Security notes

- Never expose **`SUPABASE_SERVICE_ROLE_KEY`** in client-side code or public repos for a real project.
- The **anon** key is public by design; real security comes from **RLS** and server-side checks.
- Rotate PayMongo and Supabase keys if they are ever committed or leaked.

For PayMongo-specific setup lines, see **`.env.example`** (comments only—place real secrets in Supabase / Vercel, not in git-tracked files).
