-- Apply after 002. Forecasts are computed in the database, not supplied by clients.
begin;
create table if not exists public.predictions (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 source_assessment_id uuid not null references public.assessments(id) on delete cascade,
 created_at timestamptz not null default clock_timestamp(),
 expires_at timestamptz not null,
 history_cutoff timestamptz not null,
 model_version text not null,
 protocol_version text not null,
 model_prediction_ms double precision not null,
 baseline_prediction_ms double precision not null,
 input_features jsonb not null,
 history_assessment_ids uuid[] not null,
 actual_assessment_id uuid references public.assessments(id) on delete cascade,
 actual_reaction_ms numeric,
 status text not null default 'pending' check(status in ('pending','matched','expired','invalidated')),
 unique(user_id,source_assessment_id,model_version)
);
alter table public.predictions enable row level security;
revoke all on public.predictions from anon,authenticated;
grant select,delete on public.predictions to authenticated;
drop policy if exists own_read on public.predictions;
create policy own_read on public.predictions for select to authenticated using((select auth.uid())=user_id);
drop policy if exists own_delete on public.predictions;
create policy own_delete on public.predictions for delete to authenticated using((select auth.uid())=user_id);
create index if not exists predictions_history on public.predictions(user_id,created_at desc);

-- Serialize assessment insertion and forecast creation for the same account.
create or replace function public.lock_assessment_prediction() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 perform pg_advisory_xact_lock(hashtextextended(new.user_id::text,0));
 return new;
end $$;
drop trigger if exists lock_assessment_prediction on public.assessments;
create trigger lock_assessment_prediction before insert on public.assessments
 for each row execute function public.lock_assessment_prediction();

create or replace function public.match_personal_prediction() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 -- A test already underway when the forecast was created is not prospective.
 update public.predictions p set
  status=case when new.assessment_started_at is null or new.assessment_started_at<=p.created_at then 'invalidated'
              when new.assessment_started_at>p.expires_at or clock_timestamp()>p.expires_at then 'expired'
              else 'matched' end,
  actual_assessment_id=case when new.assessment_started_at>p.created_at and new.assessment_started_at<=p.expires_at and clock_timestamp()<=p.expires_at then new.id else null end,
  actual_reaction_ms=case when new.assessment_started_at>p.created_at and new.assessment_started_at<=p.expires_at and clock_timestamp()<=p.expires_at then new.reaction_ms else null end
 where p.user_id=new.user_id and p.status='pending'
   and p.protocol_version=coalesce(new.protocol_version,'neurotwin-five-trial-v1');
 return new;
end $$;
drop trigger if exists match_personal_prediction on public.assessments;
create trigger match_personal_prediction after insert on public.assessments
 for each row execute function public.match_personal_prediction();

create or replace function public.create_personal_prediction() returns jsonb
language plpgsql security definer set search_path='' as $$
declare
 owner_id uuid:=auth.uid(); latest public.assessments; history_count integer;
 average_reaction double precision; clock_hours double precision; prediction double precision;
 saved public.predictions; reference_ids uuid[];
begin
 if owner_id is null then raise exception 'Sign in to continue'; end if;
 perform pg_advisory_xact_lock(hashtextextended(owner_id::text,0));
 if not exists(select 1 from public.preferences where user_id=owner_id and storage_consent) then
  raise exception 'Enable storage consent before creating a prediction'; end if;
 select * into latest from public.assessments where user_id=owner_id order by created_at desc,id desc limit 1;
 if latest.id is null or latest.assessment_started_at is null or latest.hours_awake is null or latest.sleepiness_score is null or latest.utc_offset_minutes is null then
  raise exception 'Complete a new assessment with hours awake and sleepiness first'; end if;
 if latest.protocol_version<>'neurotwin-five-trial-v1' then raise exception 'Unsupported assessment protocol'; end if;
 if latest.assessment_started_at>clock_timestamp() or latest.assessment_started_at<=clock_timestamp()-interval '48 hours' then
  raise exception 'Complete a recent assessment; the forecast window is 48 hours from its start'; end if;
 if latest.hours_awake>24 then raise exception 'Hours awake is outside the supported experimental input range (0-24)'; end if;
 select count(*),avg(a.reaction_ms),array_agg(a.id) into history_count,average_reaction,reference_ids from
  (select id,reaction_ms from public.assessments where user_id=owner_id
    and protocol_version=latest.protocol_version and assessment_started_at is not null
    and hours_awake is not null and sleepiness_score is not null and utc_offset_minutes is not null
    and created_at<=latest.created_at and assessment_started_at<=latest.assessment_started_at
    order by assessment_started_at desc,id desc limit 3) a;
 if history_count<3 then raise exception 'Complete at least three assessments with prediction context'; end if;
 -- Training features use local decimal hours at the prior assessment.
 clock_hours:=extract(epoch from ((latest.assessment_started_at at time zone 'UTC')+make_interval(mins=>latest.utc_offset_minutes))::time)/3600.0;
 prediction:=438.05822267620016
  +((latest.reaction_ms-435.3375893769152)/87.60521866763892)*9.508131141328553
  +((average_reaction-432.88449097718757)/78.86475682992757)*61.70568782825683
  +((latest.hours_awake-8.327800476676881)/5.557751018877843)*5.815721638113557
  +((latest.sleepiness_score-4.404494382022472)/1.974769410187105)*(-6.396519683260538)
  +((sin(2*pi()*clock_hours/24)-(-0.22628761367138453))/0.5937767062272954)*0.7159042248771346
  +((cos(2*pi()*clock_hours/24)-(-0.07211585308743601))/0.7687798402496294)*(-5.674247148939154);
 if prediction<80 or prediction>10000 then raise exception 'The experimental model produced an unsupported estimate'; end if;
 update public.predictions set status='expired' where user_id=owner_id and status='pending' and expires_at<=clock_timestamp();
 insert into public.predictions(user_id,source_assessment_id,expires_at,history_cutoff,model_version,protocol_version,model_prediction_ms,baseline_prediction_ms,input_features,history_assessment_ids)
 values(owner_id,latest.id,latest.assessment_started_at+interval '48 hours',latest.assessment_started_at,'brighter-time-research-v1',latest.protocol_version,prediction,average_reaction,
 jsonb_build_object('previous_reaction_ms',latest.reaction_ms,'recent_reaction_mean_ms',average_reaction,'previous_time_awake',latest.hours_awake,'previous_sleepiness',latest.sleepiness_score,'previous_clock_sin',sin(2*pi()*clock_hours/24),'previous_clock_cos',cos(2*pi()*clock_hours/24)),reference_ids)
 on conflict(user_id,source_assessment_id,model_version) do nothing returning * into saved;
 if saved.id is null then select * into saved from public.predictions where user_id=owner_id and source_assessment_id=latest.id and model_version='brighter-time-research-v1'; end if;
 return to_jsonb(saved);
end $$;

create or replace function public.delete_my_data() returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
 delete from public.predictions where user_id=auth.uid();
 delete from public.insights where user_id=auth.uid();
 delete from public.voices where user_id=auth.uid();
 delete from public.assessments where user_id=auth.uid();
 delete from public.checkins where user_id=auth.uid();
 delete from public.preferences where user_id=auth.uid();
end $$;
revoke all on function public.lock_assessment_prediction(),public.match_personal_prediction(),public.create_personal_prediction() from public,anon,authenticated;
grant execute on function public.create_personal_prediction() to authenticated;
commit;
