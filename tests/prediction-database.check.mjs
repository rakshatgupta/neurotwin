// Local, disposable PostgreSQL check; never connects to Supabase.
// npm install --prefix .taste-skill/prediction-check @electric-sql/pglite
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {PGlite}=require('../.taste-skill/prediction-check/node_modules/@electric-sql/pglite');
const model=JSON.parse(readFileSync(new URL('../training/artifacts/brighter-time-research-model.json',import.meta.url),'utf8'));
const db=new PGlite();
let checks=0;
const check=(condition)=>{assert.ok(condition);checks++};
const a='10000000-0000-0000-0000-000000000001',b='10000000-0000-0000-0000-000000000002';
try{
 await db.exec(`create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to authenticated,anon;`);
 for(const file of ['001_neurotwin.sql','002_assessment_prediction_context.sql','003_personal_predictions.sql'])await db.exec(readFileSync(new URL(`../supabase/migrations/${file}`,import.meta.url),'utf8'));
 // Verify migration 003 is repeatable.
 await db.exec(readFileSync(new URL('../supabase/migrations/003_personal_predictions.sql',import.meta.url),'utf8'));
 await db.query('insert into auth.users(id) values($1),($2)',[a,b]);
 await db.query('insert into public.preferences(user_id,storage_consent) values($1,true),($2,true)',[a,b]);
 async function login(id){await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id]);await db.exec('set role authenticated');}
 async function assessment(id,start,rt=350){return (await db.query(`insert into public.assessments(user_id,reaction_ms,memory_accuracy,false_starts,hours_awake,sleepiness_score,assessment_started_at,utc_offset_minutes) values($1,$2,80,0,8,5,$3,330) returning *`,[id,rt,start])).rows[0];}
 await login(a);
 await assert.rejects(()=>db.query('select public.create_personal_prediction()'),/Complete a new assessment/);checks++;
 for(let i=3;i>=1;i--)await assessment(a,new Date(Date.now()-i*3600000).toISOString(),300+i*20);
 const forecast=(await db.query('select public.create_personal_prediction() as p')).rows[0].p;
 check(forecast.status==='pending');
 const features=model.features.map(key=>Number(forecast.input_features[key]));
 const expected=features.reduce((sum,value,i)=>sum+((value-model.means[i])/model.scales[i])*model.coefficients[i],model.intercept);
 check(Math.abs(expected-forecast.model_prediction_ms)<1e-8);
 check(forecast.history_assessment_ids.length===3);
 const repeated=(await db.query('select public.create_personal_prediction() as p')).rows[0].p;
 check(repeated.id===forecast.id);
 await assert.rejects(()=>db.query('update public.predictions set model_prediction_ms=1'),/permission denied/);checks++;
 await assert.rejects(()=>db.query('insert into public.predictions(user_id) values($1)',[a]),/permission denied/);checks++;
 await login(b);
 check((await db.query('select * from public.predictions')).rows.length===0);
 await assert.rejects(()=>db.query('select public.create_personal_prediction()'),/Complete a new assessment/);checks++;
 await login(a);
 const actual=await assessment(a,new Date().toISOString(),410);
 const matched=(await db.query('select * from public.predictions where id=$1',[forecast.id])).rows[0];
 check(matched.status==='matched'&&matched.actual_assessment_id===actual.id&&Number(matched.actual_reaction_ms)===410);
 check(Number(matched.model_prediction_ms)===Number(forecast.model_prediction_ms));
 const next=(await db.query('select public.create_personal_prediction() as p')).rows[0].p;
 await assessment(a,new Date(Date.now()-10000).toISOString());
 check((await db.query('select status from public.predictions where id=$1',[next.id])).rows[0].status==='invalidated');
 const expiring=(await db.query('select public.create_personal_prediction() as p')).rows[0].p;
 await db.exec('reset role');await db.query("update public.predictions set expires_at=clock_timestamp()-interval '1 second' where id=$1",[expiring.id]);await login(a);
 await assessment(a,new Date().toISOString());
 check((await db.query('select status from public.predictions where id=$1',[expiring.id])).rows[0].status==='expired');
 await login(b);await assessment(b,new Date(Date.now()-1000).toISOString());
 await login(a);await db.query('select public.delete_my_data()');
 check((await db.query('select * from public.predictions')).rows.length===0);
 check((await db.query('select * from public.assessments')).rows.length===0);
 await login(b);check((await db.query('select * from public.assessments')).rows.length===1);
 await login(a);await assert.rejects(()=>db.query('select public.create_personal_prediction()'),/Enable storage consent/);checks++;
 console.log(`${checks} local PostgreSQL checks passed (migrations, coefficient parity, isolation, immutability, matching, invalidation, expiry, consent, deletion).`);
}finally{await db.close()}
