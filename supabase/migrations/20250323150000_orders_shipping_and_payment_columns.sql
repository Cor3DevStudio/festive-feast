-- Align public.orders with app + schema.sql (older projects may lack these columns).
-- Safe to run multiple times.

alter table public.orders add column if not exists shipping_name text;
alter table public.orders add column if not exists shipping_email text;
alter table public.orders add column if not exists shipping_phone text;
alter table public.orders add column if not exists shipping_address text;
alter table public.orders add column if not exists shipping_city text;
alter table public.orders add column if not exists shipping_province text;
alter table public.orders add column if not exists shipping_postal_code text;
alter table public.orders add column if not exists payment_method text;
alter table public.orders add column if not exists payment_intent_id text;
alter table public.orders add column if not exists paymongo_payment_id text;
alter table public.orders add column if not exists notes text;
 