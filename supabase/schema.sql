-- Run this in Supabase Dashboard -> SQL Editor to create tables and RLS.
-- Cart and orders are stored per user (profile).

-- Profiles (admin flag + saved addresses)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  is_admin boolean not null default false,
  username text,
  avatar_url text,
  gender text,
  birthday date,
  full_name text,
  phone text,
  shipping_street text,
  shipping_city text,
  shipping_province text,
  shipping_postal_code text,
  billing_same_as_shipping boolean not null default true,
  billing_street text,
  billing_city text,
  billing_province text,
  billing_postal_code text,
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Auto-create a profile row when a new user signs up.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Cart
create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id text not null,
  size text not null,
  quantity int not null default 1 check (quantity > 0),
  created_at timestamptz default now(),
  unique(user_id, product_id, size)
);

-- Orders
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending',
  total_cents int not null,
  shipping_name text,
  shipping_email text,
  shipping_phone text,
  shipping_address text,
  shipping_city text,
  shipping_province text,
  shipping_postal_code text,
  payment_method text,
  payment_intent_id text,
  paymongo_payment_id text,
  notes text,
  created_at timestamptz default now()
);

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

drop policy if exists "Users can update own orders" on public.orders;
create policy "Users can update own orders"
  on public.orders for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Admins can view all orders" on public.orders;
create policy "Admins can view all orders"
  on public.orders for select
  using (exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true
  ));

drop policy if exists "Admins can update all orders" on public.orders;
create policy "Admins can update all orders"
  on public.orders for update
  using (exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true
  ));

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

drop policy if exists "Admins can view all order items" on public.order_items;
create policy "Admins can view all order items"
  on public.order_items for select
  using (exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true
  ));

-- Products catalogue
create table if not exists public.products (
  id text primary key,
  name text not null,
  slug text not null unique,
  category text not null,
  price int not null,
  price_range_min int,
  price_range_max int,
  size_prices jsonb,
  description text not null default '',
  full_description text not null default '',
  sizes text[] not null default '{}',
  images text[] not null default '{}',
  badge text,
  in_stock boolean not null default true,
  stock_count int,
  materials text,
  dimensions text,
  sort_order int not null default 0,
  is_hidden boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.products enable row level security;

drop policy if exists "Anyone can view products" on public.products;
drop policy if exists "Anyone can view visible products" on public.products;
create policy "Anyone can view visible products"
  on public.products for select
  using (coalesce(is_hidden, false) = false);

drop policy if exists "Admins can manage products" on public.products;
create policy "Admins can manage products"
  on public.products for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

-- Product categories
create table if not exists public.product_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz default now()
);

insert into public.product_categories (name, slug)
values
  ('Parols', 'parols'),
  ('Lights', 'lights'),
  ('Holiday Decor', 'holiday-decor')
on conflict (slug) do nothing;

alter table public.product_categories enable row level security;

drop policy if exists "Anyone can view product categories" on public.product_categories;
create policy "Anyone can view product categories"
  on public.product_categories for select
  using (true);

drop policy if exists "Admins can manage product categories" on public.product_categories;
create policy "Admins can manage product categories"
  on public.product_categories for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );
