'use client';
import {createClient,type SupabaseClient} from '@supabase/supabase-js';
let client:SupabaseClient|null=null;
let refreshInFlight:Promise<string|null>|null=null;
export function browserClient(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key)return null;
 if(!client){try{client=createClient(url,key);}catch{return null;}}
 return client;
}
export async function api<T>(path:string,method='GET',body?:unknown):Promise<T>{
 const client=browserClient();if(!client)throw new Error('Connect Supabase before using the application.');
 const {data}=await client.auth.getSession();if(!data.session)throw new Error('Sign in to continue.');
 const send=(token:string)=>fetch(path,{method,headers:{Authorization:`Bearer ${token}`,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined,cache:'no-store'});
 let response=await send(data.session.access_token);
 // Our API authenticates before any mutation. Retry a rejected token once,
 // sharing concurrent refreshes; never retry provider/permission failures.
 if(response.status===401){
  if(!refreshInFlight)refreshInFlight=client.auth.refreshSession().then(({data,error})=>error?null:data.session?.access_token||null).catch(()=>null);
  const pending=refreshInFlight,token=await pending;if(refreshInFlight===pending)refreshInFlight=null;
  if(!token)throw new Error('Your session has expired. Sign in again.');
  response=await send(token);
 }
 const result=await response.json();if(!response.ok)throw new Error(result.error||'Request failed.');return result;
}
