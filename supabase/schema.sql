-- Run this in Supabase Dashboard → SQL Editor to create tables and RLS.
-- Cart and orders are stored per user (profile).

-- Cart: one row per (user_id, product_id, size)
create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id text not null,
  size text not null,
  quantity int not null default 1 check (quantity > 0),
  created_at timestamptz default now(),
  unique(user_id, product_id, size)
);

-- Orders (purchases stored in user profile)
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending',
  total_cents int not null,
  shipping_name text,
  shipping_email text,
  shipping_phone text,
  shipping_address text,
  payment_method text,
  payment_intent_id text,
  paymongo_payment_id text,
  created_at timestamptz default now()
);

-- Allow service/backend to update order (e.g. payment_intent_id, status from webhook)
drop policy if exists "Users can update own orders" on public.orders;
create policy "Users can update own orders"
  on public.orders for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Order line items
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id text not null,
  product_name text,
  size text not null,
  quantity int not null,
  unit_price_cents int not null,
  created_at timestamptz default now()
);

-- RLS
alter table public.cart_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "Users can manage own cart" on public.cart_items;
create policy "Users can manage own cart"
  on public.cart_items for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can view own orders" on public.orders;
create policy "Users can view own orders"
  on public.orders for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own orders" on public.orders;
create policy "Users can insert own orders"
  on public.orders for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can view own order items" on public.order_items;
create policy "Users can view own order items"
  on public.order_items for select
  using (exists (
    select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()
  ));

drop policy if exists "Users can insert order items for own orders" on public.order_items;
create policy "Users can insert order items for own orders"
  on public.order_items for insert
  with check (exists (
    select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()
  ));
