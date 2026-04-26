-- =============================================================================
-- Festive Feast — full database schema (single source of truth)
-- =============================================================================
-- Run once in Supabase → SQL Editor on a new project, or re-run safely on
-- older projects (uses IF NOT EXISTS / DROP POLICY IF EXISTS / ADD COLUMN IF
-- NOT EXISTS where applicable).
--
-- This file replaces the former split of: schema.sql + add_public_catalog_tables.sql
-- + multiple files under supabase/migrations/*.sql (squashed for clarity).
--
-- After changes here: deploy Edge Functions separately (supabase/functions/).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Profiles (admin flag, addresses, avatar metadata)
-- -----------------------------------------------------------------------------
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

alter table public.profiles add column if not exists username text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists gender text;
alter table public.profiles add column if not exists birthday date;
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists shipping_street text;
alter table public.profiles add column if not exists shipping_city text;
alter table public.profiles add column if not exists shipping_province text;
alter table public.profiles add column if not exists shipping_postal_code text;
alter table public.profiles add column if not exists billing_same_as_shipping boolean not null default true;
alter table public.profiles add column if not exists billing_street text;
alter table public.profiles add column if not exists billing_city text;
alter table public.profiles add column if not exists billing_province text;
alter table public.profiles add column if not exists billing_postal_code text;
alter table public.profiles add column if not exists updated_at timestamptz default now();
alter table public.profiles add column if not exists created_at timestamptz default now();

alter table public.profiles enable row level security;

-- Used by Storage + catalog RLS so checks do not recurse through profiles policies
-- under the storage service / PostgREST context.
create or replace function public.app_user_is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (select p.is_admin from public.profiles p where p.id = auth.uid()),
    false
  );
$$;

grant execute on function public.app_user_is_admin() to authenticated;

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

drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Admins can view all profiles"
  on public.profiles for select
  using (public.app_user_is_admin());

drop policy if exists "Admins can update all profiles" on public.profiles;
create policy "Admins can update all profiles"
  on public.profiles for update
  using (public.app_user_is_admin())
  with check (public.app_user_is_admin());

-- -----------------------------------------------------------------------------
-- 2. Auto-create profile on sign-up + backfill existing auth users
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  fn text := trim(coalesce(new.raw_user_meta_data->>'first_name', ''));
  ln text := trim(coalesce(new.raw_user_meta_data->>'last_name', ''));
  full_nm text;
  uname text;
begin
  full_nm := nullif(trim(fn || ' ' || ln), '');
  if full_nm is null then
    full_nm := nullif(trim(split_part(coalesce(new.email, ''), '@', 1)), '');
  end if;

  uname := lower(regexp_replace(
    nullif(trim(fn || case when fn <> '' and ln <> '' then '.' else '' end || ln), ''),
    '[^a-z0-9._-]+', '', 'g'
  ));
  if uname is null or uname = '' then
    uname := lower(regexp_replace(
      coalesce(nullif(trim(split_part(coalesce(new.email, ''), '@', 1)), ''), 'user'),
      '[^a-z0-9._-]+', '', 'g'
    ));
  end if;
  if uname is null or uname = '' then
    uname := 'user';
  end if;
  if length(uname) > 48 then
    uname := left(uname, 48);
  end if;

  insert into public.profiles (id, full_name, username, created_at, updated_at)
  values (new.id, full_nm, uname, coalesce(new.created_at, now()), now())
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

insert into public.profiles (id, created_at, updated_at)
select u.id, coalesce(u.created_at, now()), now()
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;

-- -----------------------------------------------------------------------------
-- 3. Cart
-- -----------------------------------------------------------------------------
create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id text not null,
  size text not null,
  quantity int not null default 1 check (quantity > 0),
  created_at timestamptz default now(),
  unique(user_id, product_id, size)
);

alter table public.cart_items enable row level security;

drop policy if exists "Users can manage own cart" on public.cart_items;
create policy "Users can manage own cart"
  on public.cart_items for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- 4. Orders + line items
-- -----------------------------------------------------------------------------
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

alter table public.orders enable row level security;
alter table public.order_items enable row level security;

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
  using (public.app_user_is_admin());

drop policy if exists "Admins can update all orders" on public.orders;
create policy "Admins can update all orders"
  on public.orders for update
  using (public.app_user_is_admin());

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
  using (public.app_user_is_admin());

-- -----------------------------------------------------------------------------
-- 5. Product categories
-- -----------------------------------------------------------------------------
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
  using (public.app_user_is_admin())
  with check (public.app_user_is_admin());

-- -----------------------------------------------------------------------------
-- 6. Products catalogue (PHP integer prices; dynamic category slugs)
-- -----------------------------------------------------------------------------
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

alter table public.products add column if not exists slug text;
alter table public.products add column if not exists is_hidden boolean not null default false;

update public.products
set slug = 'item-' || id
where slug is null or trim(slug) = '';

update public.products set is_hidden = false where is_hidden is null;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'products' and column_name = 'slug'
  ) then
    alter table public.products alter column slug set not null;
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.products'::regclass
      and conname = 'products_slug_key'
  ) then
    alter table public.products add constraint products_slug_key unique (slug);
  end if;
end;
$$;

alter table public.products drop constraint if exists products_category_check;

alter table public.products enable row level security;

drop policy if exists "Anyone can view products" on public.products;
drop policy if exists "Anyone can view visible products" on public.products;
create policy "Anyone can view visible products"
  on public.products for select
  using (coalesce(is_hidden, false) = false);

drop policy if exists "Admins can manage products" on public.products;
create policy "Admins can manage products"
  on public.products for all
  using (public.app_user_is_admin())
  with check (public.app_user_is_admin());

-- -----------------------------------------------------------------------------
-- 7. Storage — avatars (account profile photos)
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

drop policy if exists "Public read avatars" on storage.objects;
create policy "Public read avatars"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "Users upload own avatar folder" on storage.objects;
create policy "Users upload own avatar folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and split_part(name, '/', 1) = auth.uid()::text
  );

drop policy if exists "Users update own avatar folder" on storage.objects;
create policy "Users update own avatar folder"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and split_part(name, '/', 1) = auth.uid()::text
  );

drop policy if exists "Users delete own avatar folder" on storage.objects;
create policy "Users delete own avatar folder"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and split_part(name, '/', 1) = auth.uid()::text
  );

-- -----------------------------------------------------------------------------
-- 8. Storage — product images (admin upload in /admin/items)
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;

drop policy if exists "Public read product images" on storage.objects;
create policy "Public read product images"
  on storage.objects for select
  using (bucket_id = 'product-images');

drop policy if exists "Admins upload product images" on storage.objects;
create policy "Admins upload product images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'product-images'
    and public.app_user_is_admin()
  );

drop policy if exists "Admins update product images" on storage.objects;
create policy "Admins update product images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'product-images' and public.app_user_is_admin())
  with check (bucket_id = 'product-images' and public.app_user_is_admin());

drop policy if exists "Admins delete product images" on storage.objects;
create policy "Admins delete product images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'product-images' and public.app_user_is_admin());
