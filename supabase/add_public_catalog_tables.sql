-- Run once in Supabase → SQL Editor if `public.products` and `public.product_categories`
-- are missing (admin/storefront expect both tables).
-- Safe to re-run: uses IF NOT EXISTS / DROP POLICY IF EXISTS.

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

alter table public.products add column if not exists is_hidden boolean not null default false;

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
  )
  with check (
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
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

-- ---------------------------------------------------------------------------
-- Storage: admin uploads for product photos (same as migration
-- 20260415120000_product_images_bucket.sql). Safe to re-run.
-- ---------------------------------------------------------------------------

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
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

drop policy if exists "Admins update product images" on storage.objects;
create policy "Admins update product images"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'product-images'
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  )
  with check (
    bucket_id = 'product-images'
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

drop policy if exists "Admins delete product images" on storage.objects;
create policy "Admins delete product images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'product-images'
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );
