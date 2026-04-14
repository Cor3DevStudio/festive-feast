-- Profile: username, avatar, gender, birthday + Storage bucket for avatars
alter table public.profiles add column if not exists username text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists gender text;
alter table public.profiles add column if not exists birthday date;

-- Public bucket for avatar images (1 MB limit set in dashboard if needed)
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

-- Anyone can read avatars
drop policy if exists "Public read avatars" on storage.objects;
create policy "Public read avatars"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- Path must be {auth.uid()}/filename.ext
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
