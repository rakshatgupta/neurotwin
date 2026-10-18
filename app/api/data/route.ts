import {authenticate,json,failure,body,requireConsent,HttpError} from '../../../lib/server';
import {checkin,assessment,voice,csv,record,preferences} from '../../../lib/validation';
import {buildTwin} from '../../../lib/analytics';
import {GROQ_CONSENT_VERSION,hasGroqConsent} from '../../../lib/insights';
export const dynamic='force-dynamic';
export async function GET(request:Request){try{
 const {db,user}=await authenticate(request);
 const results=await Promise.all([
  db.from('checkins').select('id,on_date,sleep,activity,steps,stress,mood,source,bed_time,wake_time,sleep_quality,created_at,updated_at').eq('user_id',user.id).order('on_date',{ascending:false}).limit(365),
  db.from('assessments').select('id,created_at,reaction_ms,memory_accuracy,false_starts,hours_awake,sleepiness_score,assessment_started_at,utc_offset_minutes,protocol_version').eq('user_id',user.id).order('created_at',{ascending:false}).limit(100),
  db.from('voices').select('id,created_at,duration_ms,rms_mean').eq('user_id',user.id).order('created_at',{ascending:false}).limit(100),
  db.from('preferences').select('storage_consent,ai_consent,voice_consent,consent_version').eq('user_id',user.id).maybeSingle(),
  db.from('insights').select('id,content,created_at').eq('user_id',user.id).order('created_at',{ascending:false}).limit(20),
 ]);if(results.some(r=>r.error))throw new Error('Database query failed');
 const saved=results[3].data;
 const currentPreferences=saved?{storage_consent:saved.storage_consent,ai_consent:hasGroqConsent(saved),voice_consent:saved.voice_consent}:{storage_consent:false,ai_consent:false,voice_consent:false};
 const data={checkins:(results[0].data||[]).reverse(),assessments:(results[1].data||[]).reverse(),voices:(results[2].data||[]).reverse(),preferences:currentPreferences,insights:results[4].data||[],aiAvailable:!!process.env.GROQ_API_KEY?.trim(),accountDeletionAvailable:!!process.env.SUPABASE_SERVICE_ROLE_KEY};
 return json({...data,accountId:user.id,twin:buildTwin(data.checkins,data.assessments,data.voices)});
 }catch(e){return failure(e);}}
export async function POST(request:Request){try{
 const {db,user}=await authenticate(request),input=record(await body(request));
 if(input.kind==='preferences'){const values=preferences(input.values);if(values.ai_consent&&input.consentVersion!==GROQ_CONSENT_VERSION)throw new HttpError('Refresh the page and review the updated Groq consent before saving.',403);const {error}=await db.from('preferences').upsert({user_id:user.id,...values,consent_version:GROQ_CONSENT_VERSION,updated_at:new Date().toISOString()});if(error)throw error;return json({ok:true});}
 await requireConsent(db,user.id,input.kind==='voice'?'voice_consent':'storage_consent');
 let error;
 if(input.kind==='checkin')({error}=await db.from('checkins').upsert({user_id:user.id,...checkin(input.values)},{onConflict:'user_id,on_date'}));
 else if(input.kind==='import'){if(typeof input.csv!=='string')throw new HttpError('Choose a CSV file.',400);const rows=csv(input.csv);({error}=await db.from('checkins').upsert(rows.map(r=>({...r,user_id:user.id})),{onConflict:'user_id,on_date'}));}
 else if(input.kind==='assessment')({error}=await db.from('assessments').insert({user_id:user.id,...assessment(input.values)}));
 else if(input.kind==='voice')({error}=await db.from('voices').insert({user_id:user.id,...voice(input.values)}));
 else throw new HttpError('Unknown data operation.',400);
 if(error)throw error;return json({ok:true});
 }catch(e){return failure(e);}}
export async function DELETE(request:Request){try{const {db}=await authenticate(request);const {error}=await db.rpc('delete_my_data');if(error)throw error;return json({ok:true});}catch(e){return failure(e);}}
