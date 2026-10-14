-- Run against a disposable/local Supabase database after 001_neurotwin.sql.
-- All fixtures and test changes are rolled back.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path=public,extensions;
grant usage on schema extensions to authenticated,anon;
select plan(15);
insert into auth.users(id,email) values
 ('10000000-0000-0000-0000-000000000001','a@example.invalid'),
 ('10000000-0000-0000-0000-000000000002','b@example.invalid');
insert into public.preferences(user_id,storage_consent) values
 ('10000000-0000-0000-0000-000000000001',true),
 ('10000000-0000-0000-0000-000000000002',true);
insert into public.checkins(user_id,on_date,sleep,activity,stress,mood,source) values
 ('10000000-0000-0000-0000-000000000001','2026-01-01',8,30,3,'Clear','manual'),
 ('10000000-0000-0000-0000-000000000002','2026-01-01',9,40,2,'Clear','manual');
set local role anon;
select throws_ok('select * from public.checkins','42501','permission denied for table checkins','Anonymous reads denied');
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000001',true);
select is((select count(*)::integer from public.checkins),1,'Only own check-ins visible');
select is((select count(*)::integer from public.checkins where user_id='10000000-0000-0000-0000-000000000002'),0,'Other account cannot be read');
select throws_ok($$insert into public.checkins(user_id,on_date,sleep,activity,stress,mood,source) values('10000000-0000-0000-0000-000000000002','2026-01-02',8,30,3,'Clear','manual')$$,'42501','new row violates row-level security policy for table "checkins"','Other account cannot be written');
select lives_ok($$update public.checkins set sleep=7.5 where user_id='10000000-0000-0000-0000-000000000001'$$,'Own check-in can be updated');
select ok((select sleep=7.5 from public.checkins),'Own update took effect');
update public.checkins set sleep=1 where user_id='10000000-0000-0000-0000-000000000002';
delete from public.checkins where user_id='10000000-0000-0000-0000-000000000002';
select throws_ok($$insert into public.voices(user_id,duration_ms,rms_mean) values('10000000-0000-0000-0000-000000000001',4000,.1)$$,'42501','new row violates row-level security policy for table "voices"','Voice insert requires consent');
update public.preferences set voice_consent=true;
select lives_ok($$insert into public.voices(user_id,duration_ms,rms_mean) values('10000000-0000-0000-0000-000000000001',4000,.1)$$,'Consented voice insert succeeds');
select ok(public.claim_insight(),'First rate-limit claim accepted');
select ok(not public.claim_insight(),'Concurrent/repeated rate-limit claim denied');
update public.preferences set storage_consent=false,voice_consent=false,ai_consent=false;
select throws_ok($$insert into public.checkins(user_id,on_date,sleep,activity,stress,mood,source) values('10000000-0000-0000-0000-000000000001','2026-01-02',8,30,3,'Clear','manual')$$,'42501','new row violates row-level security policy for table "checkins"','Revoked consent blocks collection');
select lives_ok('select public.delete_my_data()','Delete own data succeeds');
select is((select count(*)::integer from public.checkins),0,'Own records deleted');
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000002',true);
select is((select count(*)::integer from public.checkins),1,'Other account survives deletion');
select ok((select sleep=9 from public.checkins),'Other account survived unauthorized update');
select * from finish();
rollback;
