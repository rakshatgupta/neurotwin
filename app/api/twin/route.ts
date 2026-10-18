import {authenticate,json,failure,requireConsent,HttpError} from '../../../lib/server';
import {twinSnapshot} from '../../../lib/twinSnapshot';
export const dynamic='force-dynamic';
export async function GET(request:Request){try{
 const {db,user}=await authenticate(request);
 const {data,error}=await db.from('twin_updates').select('id,created_at,algorithm_version,dataset_hash,summary').eq('user_id',user.id).order('created_at',{ascending:false}).limit(10);
 if(error)throw new HttpError('Saved processing history is unavailable. Your live baseline comparisons remain available.',503);
 return json({updates:data||[]});
}catch(e){return failure(e);}}
export async function POST(request:Request){try{
 const {db,user}=await authenticate(request);await requireConsent(db,user.id);
 const [c,a,v]=await Promise.all([
  db.from('checkins').select('id,on_date,sleep,activity,steps,stress,mood,source,bed_time,wake_time,sleep_quality,created_at,updated_at').eq('user_id',user.id).order('on_date',{ascending:false}).limit(365),
  db.from('assessments').select('id,created_at,reaction_ms,memory_accuracy,false_starts,hours_awake,sleepiness_score,assessment_started_at,utc_offset_minutes,protocol_version').eq('user_id',user.id).order('created_at',{ascending:false}).limit(100),
  db.from('voices').select('id,created_at,duration_ms,rms_mean').eq('user_id',user.id).order('created_at',{ascending:false}).limit(100),
 ]);
 if(c.error||a.error||v.error)throw new HttpError('Processing history could not be saved. Your measurements remain stored.',503);
 if(!c.data?.length&&!a.data?.length&&!v.data?.length)return json({skipped:true});
 const snapshot=twinSnapshot(c.data||[],a.data||[],v.data||[]);
 const {error}=await db.from('twin_updates').insert({user_id:user.id,...snapshot});
 if(error&&error.code!=='23505')throw new HttpError('Saved processing history is unavailable. Your live baseline comparisons remain available.',503);
 return json({ok:true,dataset_hash:snapshot.dataset_hash});
}catch(e){return failure(e);}}
