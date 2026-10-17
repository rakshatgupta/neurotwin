import {createClient,type SupabaseClient} from '@supabase/supabase-js';
import {InputError} from './validation';
export class HttpError extends Error{status:number;constructor(message:string,status:number){super(message);this.status=status;}}
export async function authenticate(request:Request){
 const token=request.headers.get('Authorization')?.match(/^Bearer ([^\s]+)$/)?.[1];
 if(!token||token.length>8192)throw new HttpError('Sign in to continue.',401);
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key)throw new HttpError('The database is not configured yet.',503);
 const db=createClient(url,key,{global:{headers:{Authorization:`Bearer ${token}`}},auth:{persistSession:false,autoRefreshToken:false}});
 const {data,error}=await db.auth.getUser(token);if(error||!data.user)throw new HttpError('Your session has expired. Sign in again.',401);
 return {db,user:data.user};
}
export function json(body:unknown,status=200){return Response.json(body,{status,headers:{'Cache-Control':'private, no-store','Vary':'Authorization'}});}
export async function body(request:Request){const reader=request.body?.getReader();if(!reader)throw new InputError('A JSON body is required.');const chunks:Uint8Array[]=[];let size=0;while(true){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>120000){await reader.cancel();throw new InputError('Request is too large.');}chunks.push(value);}const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}try{return JSON.parse(new TextDecoder().decode(bytes));}catch{throw new InputError('Invalid JSON.');}}
export function failure(e:unknown){if(e instanceof HttpError)return json({error:e.message},e.status);if(e instanceof InputError)return json({error:e.message},400);return json({error:'The request could not be completed. Check your connection and database setup.'},500);}
export async function requireConsent(db:SupabaseClient,id:string,field:'storage_consent'|'ai_consent'|'voice_consent'='storage_consent') {const {data,error}=await db.from('preferences').select('storage_consent,ai_consent,voice_consent,consent_version').eq('user_id',id).maybeSingle();if(error)throw error;if(!data?.storage_consent||!data[field])throw new HttpError('Enable the required consent setting before continuing.',403);return data;}
