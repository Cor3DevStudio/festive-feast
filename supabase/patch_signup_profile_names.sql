-- Run on existing projects: profile rows from sign-up get full_name + username from auth user_metadata (first_name, last_name).
-- Client sends these via supabase.auth.signUp({ options: { data: { first_name, last_name } } }).

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
