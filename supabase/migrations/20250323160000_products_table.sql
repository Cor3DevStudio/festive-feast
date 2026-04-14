-- Products catalogue stored in the database.
-- Prices are in Philippine Pesos (integer).
-- size_prices is a JSONB map of size label → price, e.g. {"12\"": 1499, "18\"": 1999}.

create table if not exists public.products (
  id            text primary key,
  name          text not null,
  slug          text not null unique,
  category      text not null check (category in ('parols', 'lights', 'holiday-decor')),
  price         int  not null,
  price_range_min int,
  price_range_max int,
  size_prices   jsonb,
  description   text not null default '',
  full_description text not null default '',
  sizes         text[] not null default '{}',
  images        text[] not null default '{}',
  badge         text,
  in_stock      boolean not null default true,
  stock_count   int,
  materials     text,
  dimensions    text,
  sort_order    int not null default 0,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

alter table public.products enable row level security;

drop policy if exists "Anyone can view products" on public.products;
create policy "Anyone can view products"
  on public.products for select using (true);

drop policy if exists "Admins can manage products" on public.products;
create policy "Admins can manage products"
  on public.products for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );
