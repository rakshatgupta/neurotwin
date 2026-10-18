import {authenticate,json,failure,body,requireConsent,HttpError} from '../../../lib/server';
import {record} from '../../../lib/validation';
import {buildTwin} from '../../../lib/analytics';
import {generateGroqInsight} from '../../../lib/groq';
import {GROQ_CONSENT_VERSION,hasGroqConsent,statisticalInsight} from '../../../lib/insights';
export const dynamic='force-dynamic';
export const maxDuration=60;
export async function POST(request:Request){try{
 const {db,user}=await authenticate(request),input=record(await body(request));
 if(input.consent!==true||input.consentVersion!==GROQ_CONSENT_VERSION)throw new HttpError('Review and confirm the Groq consent before generating an AI explanation.',403);
 const consent=await requireConsent(db,user.id,'ai_consent');
 if(!hasGroqConsent(consent))throw new HttpError('Save the updated Groq consent in Privacy & data first.',403);
 const [c,a,v]=await Promise.all([
  db.from('checkins').select('on_date,sleep,activity,steps,stress,mood,source,bed_time,wake_time,sleep_quality').eq('user_id',user.id).order('on_date',{ascending:false}).limit(365),
  db.from('assessments').select('created_at,reaction_ms,memory_accuracy,false_starts').eq('user_id',user.id).order('created_at',{ascending:false}).limit(100),
  db.from('voices').select('created_at,duration_ms,rms_mean').eq('user_id',user.id).order('created_at',{ascending:false}).limit(100),
 ]);
 if(c.error||a.error||v.error)throw new Error('Database query failed');
 if(!c.data?.length&&!a.data?.length&&!v.data?.length)throw new HttpError('Save at least one check-in, cognitive result or optional voice feature first.',400);
 const twin=buildTwin(c.data,a.data||[],v.data||[]);
 const fallback=(notice:string)=>json({kind:'statistical',content:statisticalInsight(twin),notice});
 if(!process.env.GROQ_API_KEY?.trim())return fallback('Groq is not configured. Your statistical summary works without an API key.');
 const {data:allowed,error:limitError}=await db.rpc('claim_insight');
 if(limitError)throw limitError;
 if(!allowed)return fallback('The app allows 10 AI attempts per UTC day, at least one minute apart. Your statistical summary remains available.');
 const result=await generateGroqInsight({baseline:twin.status,observations:twin.checkinDays,cognitiveSessions:twin.assessmentSessions,voiceRecordings:twin.voiceRecordings,latest:twin.latest,factors:twin.factors,relativeChanges:twin.deviations,sleepTrendHoursPerDay:twin.sleepTrend,method:twin.method},{key:process.env.GROQ_API_KEY,model:process.env.GROQ_MODEL});
 if(result.kind==='unavailable')return fallback(result.notice);
 const current=await requireConsent(db,user.id,'ai_consent');
 if(!hasGroqConsent(current))throw new HttpError('Groq consent was withdrawn while this request was running. The explanation was not saved.',403);
 const content=`AI explanation from Groq (${result.model})\n\n${result.content}`;
 if(content.length>6000)throw new HttpError('The AI explanation could not be saved.',502);
 const {error}=await db.from('insights').insert({user_id:user.id,content});
 if(error)throw error;
 return json({kind:'ai',content});
 }catch(e){return failure(e);}}
