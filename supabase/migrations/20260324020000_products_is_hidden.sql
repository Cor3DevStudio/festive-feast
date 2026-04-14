-- Hide products from the storefront while keeping them in admin.
alter table public.products add column if not exists is_hidden boolean not null default false;

update public.products set is_hidden = false where is_hidden is null;

drop policy if exists "Anyone can view products" on public.products;
create policy "Anyone can view visible products"
  on public.products for select
  using (coalesce(is_hidden, false) = false);
