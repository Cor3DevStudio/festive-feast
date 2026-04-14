-- Align older `products` tables missing `slug` (fixes PostgREST 400: column products.slug does not exist).
alter table public.products add column if not exists slug text;

update public.products
set slug = 'item-' || id
where slug is null or trim(slug) = '';

alter table public.products alter column slug set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.products'::regclass
      and conname = 'products_slug_key'
  ) then
    alter table public.products add constraint products_slug_key unique (slug);
  end if;
end;
$$;
