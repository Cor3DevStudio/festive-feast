-- Optional patch if uploads still fail after an older schema.sql run.
-- Run in Supabase SQL Editor once. Safe to re-run (CREATE OR REPLACE + DROP POLICY).

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

drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Admins can view all profiles"
  on public.profiles for select
  using (public.app_user_is_admin());

drop policy if exists "Admins can update all profiles" on public.profiles;
create policy "Admins can update all profiles"
  on public.profiles for update
  using (public.app_user_is_admin())
  with check (public.app_user_is_admin());

drop policy if exists "Admins can view all orders" on public.orders;
create policy "Admins can view all orders"
  on public.orders for select
  using (public.app_user_is_admin());

drop policy if exists "Admins can update all orders" on public.orders;
create policy "Admins can update all orders"
  on public.orders for update
  using (public.app_user_is_admin());

drop policy if exists "Admins can view all order items" on public.order_items;
create policy "Admins can view all order items"
  on public.order_items for select
  using (public.app_user_is_admin());

drop policy if exists "Admins can manage product categories" on public.product_categories;
create policy "Admins can manage product categories"
  on public.product_categories for all
  using (public.app_user_is_admin())
  with check (public.app_user_is_admin());

drop policy if exists "Admins can manage products" on public.products;
create policy "Admins can manage products"
  on public.products for all
  using (public.app_user_is_admin())
  with check (public.app_user_is_admin());

drop policy if exists "Admins upload product images" on storage.objects;
create policy "Admins upload product images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'product-images' and public.app_user_is_admin());

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
