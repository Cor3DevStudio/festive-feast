-- Add profile address columns (safe to run on existing projects)
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

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);
