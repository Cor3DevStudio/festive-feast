# Order confirmation email (Gmail SMTP)

When a customer completes **Place order**, the app calls **`POST /api/send-order-confirmation`** (Vercel serverless). That route loads the order and line items from Supabase, then sends HTML mail **through your Gmail account** using **Nodemailer** (no Resend or other email SaaS).

## 1. Google App Password (required)

Gmail does not allow normal passwords for SMTP apps. Use an **App Password**:

1. Google Account → **Security** → **2-Step Verification** (must be on).
2. **App passwords** → create one for “Mail” / “Other”.
3. Copy the 16-character password.

## 2. Environment variables

### Local dev (`.env`)

Same values as production where applicable:

| Variable | Purpose |
|----------|---------|
| `GMAIL_USER` | Your full Gmail address (e.g. `you@gmail.com`) |
| `GMAIL_APP_PASSWORD` | The Google App Password (not your login password) |
| `SUPABASE_SERVICE_ROLE_KEY` | Already used for other dev API proxies |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | Already present |

Optional:

| Variable | Purpose |
|----------|---------|
| `STORE_NAME` | Shown in subject/body (default: Christmas Decors PH) |
| `SITE_PUBLIC_URL` or `VITE_SITE_URL` | “Visit our shop” link in the email |

### Vercel (production)

In **Project → Settings → Environment Variables**, add:

- `GMAIL_USER`
- `GMAIL_APP_PASSWORD`
- Plus existing: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

Redeploy after changing env vars.

## 3. Local development

`npm run dev` serves a Vite middleware that handles `/api/send-order-confirmation` the same way as Vercel (Gmail + Supabase). Ensure `.env` includes the Gmail and Supabase keys above.

## 4. Troubleshooting

- **Invalid login / 535**: Wrong App Password, or 2FA/App Passwords not enabled.
- **Less secure apps**: Not used; App Password is the supported approach.
- **“Server missing GMAIL_USER…”**: Env not set on Vercel or missing from `.env` locally.

Implementation: `lib/orderConfirmationGmail.ts` (shared), `api/send-order-confirmation.ts` (Vercel).
