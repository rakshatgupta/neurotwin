-- Additive preparation for experimental personal predictions.
-- Existing assessments remain valid; missing context is never backfilled.
begin;

alter table public.assessments
  add column if not exists hours_awake numeric,
  add column if not exists sleepiness_score integer,
  add column if not exists assessment_started_at timestamptz,
  add column if not exists utc_offset_minutes integer,
  add column if not exists protocol_version text not null default 'neurotwin-five-trial-v1';

do $$
begin
  if not exists (select 1 from pg_constraint where conrelid='public.assessments'::regclass and conname='assessment_hours_awake_range') then
    alter table public.assessments add constraint assessment_hours_awake_range
      check (hours_awake is null or hours_awake between 0 and 48);
  end if;
  if not exists (select 1 from pg_constraint where conrelid='public.assessments'::regclass and conname='assessment_sleepiness_range') then
    alter table public.assessments add constraint assessment_sleepiness_range
      check (sleepiness_score is null or sleepiness_score between 1 and 10);
  end if;
  if not exists (select 1 from pg_constraint where conrelid='public.assessments'::regclass and conname='assessment_utc_offset_range') then
    alter table public.assessments add constraint assessment_utc_offset_range
      check (utc_offset_minutes is null or utc_offset_minutes between -840 and 840);
  end if;
  if not exists (select 1 from pg_constraint where conrelid='public.assessments'::regclass and conname='assessment_protocol_length') then
    alter table public.assessments add constraint assessment_protocol_length
      check (length(protocol_version) between 1 and 80);
  end if;
end $$;

-- Existing account ownership policies, consent checks and cascade deletion
-- continue to govern these columns through the assessments table.
commit;
