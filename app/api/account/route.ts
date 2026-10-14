import {createClient} from '@supabase/supabase-js';
import {authenticate,json,failure,body,HttpError} from '../../../lib/server';
import {record} from '../../../lib/validation';
export async function DELETE(request:Request){try{
 const {user}=await authenticate(request),input=record(await body(request));
 if(input.confirmation!=='DELETE')throw new HttpError('Type DELETE to confirm account removal.',400);
 const key=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!key)throw new HttpError('Account deletion is not configured. Contact the project owner; you can still delete your wellness data.',503);
 const admin=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const {error}=await admin.auth.admin.deleteUser(user.id);if(error)throw error;return json({ok:true});
 }catch(e){return failure(e);}}
