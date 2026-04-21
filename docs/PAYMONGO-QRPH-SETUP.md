# PayMongo QR Ph setup

This app uses **PayMongo** for QR Ph (scan-to-pay). The **secret key** is only used on the server (Supabase Edge Functions), never in the frontend.

## 1. Apply database change

In **Supabase Dashboard → SQL Editor**, run **`supabase/schema.sql`** (includes `payment_intent_id` and order update policies). If you already ran the full schema, run only:

```sql
alter table public.orders add column if not exists payment_intent_id text;
alter table public.orders add column if not exists paymongo_payment_id text;
drop policy if exists "Users can update own orders" on public.orders;
create policy "Users can update own orders"
  on public.orders for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

## 2. Edge Function secrets

In **Supabase Dashboard → Edge Functions → Secrets** (or Project Settings → Edge Functions), set:

| Secret | Value |
|--------|--------|
| `PAYMONGO_SECRET_KEY` | Your PayMongo **secret** key (e.g. `sk_live_...`) |
| `SUPABASE_SERVICE_ROLE_KEY` | From Supabase **Settings → API → service_role** |

`SUPABASE_URL` and `SUPABASE_ANON_KEY` are usually set automatically for Edge Functions.

## 3. Deploy Edge Functions

From the project root:

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase functions deploy create-qrph-payment
npx supabase functions deploy paymongo-webhook
```

Use your Supabase project ref (e.g. `nzlzymypanaeplxemlkw`).

## 4. PayMongo webhook (optional but recommended)

So that orders are marked **paid** when the customer pays via QR Ph:

1. In **PayMongo Dashboard → Webhooks**, add a webhook.
2. **URL**: `https://<your-project-ref>.supabase.co/functions/v1/paymongo-webhook`
3. **Events**: subscribe to `payment.paid`.
4. Save.

When a QR Ph payment succeeds, PayMongo calls this URL and the function updates the order to `status = 'paid'`.

## 5. Frontend (no changes needed)

The app already uses your **Supabase URL** and **anon key** in `.env`. It never uses the PayMongo secret key; that is only in Edge Function secrets.

## Summary

- **Frontend**: Uses Supabase anon key; calls `create-qrph-payment` Edge Function with the user’s JWT.
- **Edge Function**: Uses PayMongo **secret** key to create Payment Intent + QR Ph and returns the QR image.
- **Webhook**: Uses **service_role** to update the order to `paid` when PayMongo sends `payment.paid`.
