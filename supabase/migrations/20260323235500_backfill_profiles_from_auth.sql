-- Ensure every Auth user has a corresponding profiles row.
-- This fixes Admin Users list gaps when profile trigger did not run historically.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, created_at, updated_at)
  values (new.id, coalesce(new.created_at, now()), now())
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
