-- Additive migration after 003. Does not delete existing records.
begin;
alter table public.checkins add column if not exists bed_time time,
 add column if not exists wake_time time,
 add column if not exists sleep_quality integer,
 add column if not exists updated_at timestamptz not null default now();
do $$ begin
 if not exists(select 1 from pg_constraint where conrelid='public.checkins'::regclass and conname='checkin_sleep_quality_range') then
  alter table public.checkins add constraint checkin_sleep_quality_range check(sleep_quality is null or sleep_quality between 1 and 5);
 end if;
end $$;
create or replace function public.touch_checkin_update() returns trigger language plpgsql set search_path='' as $$
begin new.updated_at=clock_timestamp();return new;end $$;
drop trigger if exists touch_checkin_update on public.checkins;
create trigger touch_checkin_update before update on public.checkins for each row execute function public.touch_checkin_update();

create table if not exists public.twin_updates (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,
 created_at timestamptz not null default clock_timestamp(),
 algorithm_version text not null check(length(algorithm_version) between 1 and 80),
 dataset_hash text not null check(dataset_hash ~ '^[a-f0-9]{64}$'),
 summary jsonb not null check(jsonb_typeof(summary)='object' and octet_length(summary::text)<=250000),
 unique(user_id,algorithm_version,dataset_hash)
);
alter table public.twin_updates enable row level security;
revoke all on public.twin_updates from anon,authenticated;
grant select,insert,delete on public.twin_updates to authenticated;
drop policy if exists own_read on public.twin_updates;
create policy own_read on public.twin_updates for select to authenticated using((select auth.uid())=user_id);
drop policy if exists own_insert on public.twin_updates;
create policy own_insert on public.twin_updates for insert to authenticated with check((select auth.uid())=user_id and exists(select 1 from public.preferences where user_id=(select auth.uid()) and storage_consent));
drop policy if exists own_delete on public.twin_updates;
create policy own_delete on public.twin_updates for delete to authenticated using((select auth.uid())=user_id);
create index if not exists twin_updates_history on public.twin_updates(user_id,created_at desc);

create or replace function public.delete_my_data() returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
 delete from public.twin_updates where user_id=auth.uid();
 delete from public.predictions where user_id=auth.uid();
 delete from public.insights where user_id=auth.uid();
 delete from public.voices where user_id=auth.uid();
 delete from public.assessments where user_id=auth.uid();
 delete from public.checkins where user_id=auth.uid();
 delete from public.preferences where user_id=auth.uid();
end $$;
commit;
