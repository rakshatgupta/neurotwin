-- Persistent profiles. Account IDs, not names or emails, isolate all wellness data.
begin;
create table if not exists public.account_profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 username text not null unique check(username ~ '^[a-z][a-z0-9_]{2,23}$'),
 display_name text not null check(length(display_name) between 1 and 60),
 created_at timestamptz not null default now()
);
alter table public.account_profiles enable row level security;
revoke all on public.account_profiles from anon,authenticated;
grant select on public.account_profiles to authenticated;
drop policy if exists own_profile_read on public.account_profiles;
create policy own_profile_read on public.account_profiles for select to authenticated using((select auth.uid())=user_id);

create or replace function public.create_account_profile() returns trigger
language plpgsql security definer set search_path='' as $$
declare handle text; label text;
begin
 -- Existing accounts remain valid; new email accounts must supply a profile.
 if new.is_anonymous is true then return new; end if;
 handle:=lower(trim(coalesce(new.raw_user_meta_data->>'username','')));
 label:=trim(coalesce(new.raw_user_meta_data->>'display_name',''));
 if handle !~ '^[a-z][a-z0-9_]{2,23}$' or length(label) not between 1 and 60 then
  raise exception 'A valid username and display name are required';
 end if;
 insert into public.account_profiles(user_id,username,display_name) values(new.id,handle,label);
 return new;
end;
$$;
revoke all on function public.create_account_profile() from public,anon,authenticated;
drop trigger if exists on_neurotwin_account_created on auth.users;
create trigger on_neurotwin_account_created after insert on auth.users for each row execute function public.create_account_profile();
commit;
