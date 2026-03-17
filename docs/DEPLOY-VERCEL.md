# Deploy to Vercel

## 1. One-time: Vercel login and link

```bash
npx vercel login
cd e:\CoreDev\Projects\festive-feast
npx vercel link
```

Choose your team and create/link a project when prompted.

## 2. Set environment variables

In Vercel Dashboard → your project → **Settings → Environment Variables**, add:

| Name | Value | Notes |
|------|--------|------|
| `VITE_SUPABASE_URL` | `https://YOUR_PROJECT_REF.supabase.co` | From Supabase Dashboard → Settings → API |
| `VITE_SUPABASE_ANON_KEY` | Your anon (public) key | Same place |
| `SUPABASE_SERVICE_ROLE_KEY` | Your **service_role** key | Same place; **required** for QR Ph proxy (server-only, never exposed to browser) |

Apply to **Production**, **Preview**, and **Development** if you use preview deploys.

## 3. Deploy Edge Functions to Supabase (fix 401)

The app calls Supabase Edge Functions. Deploy them and apply the config that skips the platform JWT check (your functions validate the user JWT themselves):

```bash
cd e:\CoreDev\Projects\festive-feast
supabase functions deploy create-qrph-payment
supabase functions deploy paymongo-webhook
```

If your project uses `supabase/config.toml` with `verify_jwt = false` for these functions, that config is used when you deploy. Otherwise deploy with:

```bash
supabase functions deploy create-qrph-payment --no-verify-jwt
supabase functions deploy paymongo-webhook --no-verify-jwt
```

Set Supabase secrets (Dashboard → Edge Functions → Secrets or CLI):

- `PAYMONGO_SECRET_KEY` – required for QR Ph payments
- `PAYMONGO_WEBHOOK_SECRET` – optional, for webhook signature verification

## 4. Deploy the frontend to Vercel

```bash
npm run deploy
```

Or `npx vercel --prod`. After any code changes, run `npm run deploy` again to redeploy.

**Auto-deploy on push:** If the project is connected to a Git repo in Vercel (Settings → Git), every push to the production branch builds and deploys automatically—no need to run `npm run deploy` manually.

## 5. After deploy

- Open the Vercel URL and test login, cart, and checkout.
- **QR Ph flow:** The Vercel API route validates your JWT and calls the Edge Function with the service role + `user_id`, so 401 from “JWT not reaching Supabase” is fixed. Ensure `SUPABASE_SERVICE_ROLE_KEY` is set in Vercel.
- Redeploy the Edge Function after any change: `supabase functions deploy create-qrph-payment`.
