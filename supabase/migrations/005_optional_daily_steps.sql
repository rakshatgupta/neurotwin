-- Run after 001–004. Steps are optional counts, never converted from minutes.
begin;
alter table public.checkins add column if not exists steps integer;
do $$ begin
 if not exists(select 1 from pg_constraint where conrelid='public.checkins'::regclass and conname='checkin_steps_range') then
  alter table public.checkins add constraint checkin_steps_range check(steps is null or steps between 0 and 200000);
 end if;
end $$;
-- Existing checkin ownership, consent policies and deletion cascade still apply.
commit;
