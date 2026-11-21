import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{PGlite}=require('../.taste-skill/prediction-check/node_modules/@electric-sql/pglite');
const db=new PGlite();
try{
 await db.exec(`create role anon;create role authenticated;create schema auth;
 create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 grant usage on schema auth to authenticated;
 create table auth.users(id uuid primary key,email text unique,is_anonymous boolean default false,raw_user_meta_data jsonb);`);
 await db.exec(readFileSync('supabase/migrations/006_account_profiles.sql','utf8'));
 const a='11111111-1111-1111-1111-111111111111',b='22222222-2222-2222-2222-222222222222';
 const insert=(id,email,handle)=>db.query('insert into auth.users values ($1,$2,false,$3::jsonb)',[id,email,JSON.stringify({username:handle,display_name:'Same name'})]);
 await insert(a,'a@example.invalid','Anand');
 await assert.rejects(()=>insert(b,'b@example.invalid','ANAND'),/unique/i);
 assert.equal((await db.query('select count(*)::int as n from auth.users')).rows[0].n,1);
 await assert.rejects(()=>insert(b,'a@example.invalid','another'),/unique/i);
 await assert.rejects(()=>insert(b,'b@example.invalid','!bad'),/valid username/i);
 await insert(b,'b@example.invalid','rakshat');
 await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub','${a}',false)`);
 const rows=(await db.query('select * from public.account_profiles')).rows;
 assert.equal(rows.length,1);assert.equal(rows[0].username,'anand');
 await assert.rejects(()=>db.exec(`update public.account_profiles set username='other'`),/permission/i);
 await db.exec('reset role');await db.query('delete from auth.users where id=$1',[a]);
 assert.equal((await db.query('select count(*)::int as n from public.account_profiles')).rows[0].n,1);
 console.log('Profile database checks passed: canonical uniqueness, atomic signup rollback, RLS isolation and account deletion cascade.');
}finally{await db.close();}
