begin;
create table public.preferences (
 user_id uuid primary key references auth.users(id) on delete cascade,
 storage_consent boolean not null default false,
 ai_consent boolean not null default false,
 voice_consent boolean not null default false,
 consent_version text not null default '2026-10-14',
 updated_at timestamptz not null default now(),
 check(storage_consent or (not ai_consent and not voice_consent))
);
create table public.checkins (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 on_date date not null check(on_date between '2000-01-01' and '2100-12-31'),
 sleep numeric not null check(sleep between 0 and 24),activity numeric not null check(activity between 0 and 1440),
 stress numeric not null check(stress between 0 and 10),mood text not null check(mood in ('Clear','Balanced','Foggy','Tired')),
 source text not null check(source in ('manual','csv')),created_at timestamptz not null default now(),
 unique(user_id,on_date)
);
create table public.assessments (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 reaction_ms numeric not null check(reaction_ms between 80 and 10000), memory_accuracy numeric not null check(memory_accuracy between 0 and 100),
 false_starts integer not null check(false_starts between 0 and 100),created_at timestamptz not null default now()
);
create table public.voices (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 duration_ms numeric not null check(duration_ms between 3000 and 61000),rms_mean numeric not null check(rms_mean between 0 and 1),
 created_at timestamptz not null default now()
);
create table public.insights (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,
 content text not null check(length(content)<=6000),created_at timestamptz not null default now()
);
create table public.ai_usage (
 user_id uuid not null references auth.users(id) on delete cascade,day date not null default (now() at time zone 'UTC')::date,
 attempts integer not null default 1,last_started timestamptz not null default now(),primary key(user_id,day)
);
alter table public.preferences enable row level security;
alter table public.checkins enable row level security;
alter table public.assessments enable row level security;
alter table public.voices enable row level security;
alter table public.insights enable row level security;
alter table public.ai_usage enable row level security;
revoke all on public.preferences,public.checkins,public.assessments,public.voices,public.insights,public.ai_usage from anon;
revoke all on public.preferences,public.checkins,public.assessments,public.voices,public.insights,public.ai_usage from authenticated;
grant select,insert,update,delete on public.preferences,public.checkins,public.assessments,public.voices,public.insights to authenticated;
create policy preferences_read on public.preferences for select to authenticated using((select auth.uid())=user_id);
create policy preferences_insert on public.preferences for insert to authenticated with check((select auth.uid())=user_id);
create policy preferences_update on public.preferences for update to authenticated using((select auth.uid())=user_id) with check((select auth.uid())=user_id);
create policy preferences_delete on public.preferences for delete to authenticated using((select auth.uid())=user_id);
do $$
declare table_name text;
begin
 foreach table_name in array array['checkins','assessments','voices','insights'] loop
  execute format('create policy own_read on public.%I for select to authenticated using ((select auth.uid())=user_id)',table_name);
  execute format('create policy own_delete on public.%I for delete to authenticated using ((select auth.uid())=user_id)',table_name);
  execute format('create policy own_insert on public.%I for insert to authenticated with check ((select auth.uid())=user_id and exists(select 1 from public.preferences p where p.user_id=(select auth.uid()) and p.storage_consent%s))',table_name,case when table_name='voices' then ' and p.voice_consent' when table_name='insights' then ' and p.ai_consent' else '' end);
 end loop;
end $$;
create policy own_update on public.checkins for update to authenticated using((select auth.uid())=user_id) with check((select auth.uid())=user_id and exists(select 1 from public.preferences p where p.user_id=(select auth.uid()) and p.storage_consent));
create index checkins_history on public.checkins(user_id,on_date);
create index assessments_history on public.assessments(user_id,created_at);
create index voices_history on public.voices(user_id,created_at);
create index insights_history on public.insights(user_id,created_at);
create or replace function public.claim_insight() returns boolean language plpgsql security definer set search_path='' as $$
declare affected integer; utc_day date := (now() at time zone 'UTC')::date;
begin
 if auth.uid() is null then return false; end if;
 insert into public.ai_usage(user_id,day,attempts,last_started) values(auth.uid(),utc_day,1,now())
 on conflict(user_id,day) do update set attempts=public.ai_usage.attempts+1,last_started=now()
 where public.ai_usage.attempts<10 and public.ai_usage.last_started<now()-interval '60 seconds';
 get diagnostics affected=row_count;
 return affected=1;
end $$;
create or replace function public.delete_my_data() returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 delete from public.insights where user_id=auth.uid();
 delete from public.voices where user_id=auth.uid();
 delete from public.assessments where user_id=auth.uid();
 delete from public.checkins where user_id=auth.uid();
 delete from public.preferences where user_id=auth.uid();
end $$;
revoke all on function public.claim_insight(),public.delete_my_data() from public,anon;
grant execute on function public.claim_insight(),public.delete_my_data() to authenticated;
commit;
