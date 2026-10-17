import {authenticate,json,failure,body,requireConsent,HttpError} from '../../../lib/server';
export const dynamic='force-dynamic';
const permittedMessages=new Set([
 'Complete a new assessment with hours awake and sleepiness first',
 'Unsupported assessment protocol',
 'Complete a recent assessment; the forecast window is 48 hours from its start',
 'Hours awake is outside the supported experimental input range (0-24)',
 'Complete at least three assessments with prediction context',
 'The experimental model produced an unsupported estimate',
 'Enable storage consent before creating a prediction',
]);
export async function GET(request:Request){try{
 const {db,user}=await authenticate(request);
 const {data,error}=await db.from('predictions').select('id,created_at,expires_at,history_cutoff,model_version,protocol_version,model_prediction_ms,baseline_prediction_ms,actual_reaction_ms,status').eq('user_id',user.id).order('created_at',{ascending:false}).limit(100);
 if(error)throw new HttpError('Personal predictions are not ready. The owner should apply database migration 003.',503);
 return json({predictions:data||[]});
}catch(e){return failure(e);}}
export async function POST(request:Request){try{
 const {db,user}=await authenticate(request);
 const input=await body(request);
 if(input?.acknowledgeExperiment!==true)throw new HttpError('Acknowledge the experimental prediction limitations first.',400);
 await requireConsent(db,user.id);
 // No identity, inputs, predictions or model coefficients are accepted from callers.
 const {data,error}=await db.rpc('create_personal_prediction');
 if(error){if(permittedMessages.has(error.message))throw new HttpError(error.message,400);throw new HttpError('Prediction could not be saved. Check database migration 003 and try again.',503);}
 return json({prediction:data});
}catch(e){return failure(e);}}
