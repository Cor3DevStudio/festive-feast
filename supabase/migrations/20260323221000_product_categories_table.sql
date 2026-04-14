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
  on public.product_categories for select using (true);

drop policy if exists "Admins can manage product categories" on public.product_categories;
create policy "Admins can manage product categories"
  on public.product_categories for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

alter table public.products drop constraint if exists products_category_check;

