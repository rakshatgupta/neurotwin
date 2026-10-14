import {authenticate,json,failure,body,requireConsent,HttpError} from '../../../lib/server';
import {record} from '../../../lib/validation';
import {buildTwin} from '../../../lib/analytics';
export const dynamic='force-dynamic';
export const maxDuration=60;
export async function POST(request:Request){try{
 const {db,user}=await authenticate(request),input=record(await body(request));
 if(input.consent!==true)throw new HttpError('Confirm consent before generating an AI insight.',403);
 await requireConsent(db,user.id,'ai_consent');
 if(!process.env.OPENAI_API_KEY||!process.env.OPENAI_MODEL)throw new HttpError('AI insights are not configured. The recorded-data analysis remains available.',503);
 const [c,a,v]=await Promise.all([db.from('checkins').select('on_date,sleep,activity,stress,mood,source').eq('user_id',user.id).order('on_date',{ascending:false}).limit(31),db.from('assessments').select('created_at,reaction_ms,memory_accuracy,false_starts').eq('user_id',user.id).order('created_at',{ascending:false}).limit(31),db.from('voices').select('created_at,duration_ms,rms_mean').eq('user_id',user.id).order('created_at',{ascending:false}).limit(31)]);
 if(c.error||a.error||v.error)throw new Error('Database query failed');
 if(!c.data?.length)throw new HttpError('Save at least one daily check-in first.',400);
 const twin=buildTwin(c.data,a.data||[],v.data||[]);
 const {data:allowed,error:limitError}=await db.rpc('claim_insight');if(limitError)throw limitError;if(!allowed)throw new HttpError('Wait one minute between insights. The limit is 10 attempts per UTC day.',429);
 const response=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({model:process.env.OPENAI_MODEL,store:false,max_output_tokens:700,instructions:'You explain recorded wellness patterns. Use only the supplied numeric summary. Do not diagnose, predict neurological disease, score brain health, invent causation, or recommend medication. Distinguish a forming baseline from an established one. Mention uncertainty, practice effects in cognitive tasks, and microphone differences for voice levels when relevant. Write 2 short plain-text paragraphs and 2 gentle everyday wellness suggestions. Suggest professional advice only for persistent concerning symptoms, without implying a diagnosis. No markup or clinical claims.',input:JSON.stringify({baseline:twin.status,observations:twin.checkinDays,latest:twin.latest,factors:twin.factors,relativeChanges:twin.deviations,sleepTrendHoursPerDay:twin.sleepTrend,method:twin.method})}),signal:AbortSignal.timeout(45000)});
 if(!response.ok)throw new HttpError('The AI provider could not complete the request. Try again later.',502);
 const result=await response.json();
 if(result.status!=='completed')throw new HttpError('The AI response was incomplete. Please try again.',502);
 const content=(Array.isArray(result.output)?result.output:[]).flatMap((item:{content?:{type:string;text?:string}[]})=>Array.isArray(item.content)?item.content:[]).filter((item:{type:string})=>item.type==='output_text').map((item:{text?:string})=>item.text||'').join('\n').trim();
 if(!content||content.length>6000)throw new HttpError('The AI response could not be used. Try again later.',502);
 await requireConsent(db,user.id,'ai_consent');
 const {error}=await db.from('insights').insert({user_id:user.id,content});if(error)throw error;
 return json({content});
 }catch(e){return failure(e);}}
