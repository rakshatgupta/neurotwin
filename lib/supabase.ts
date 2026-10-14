'use client';
import {createClient,type SupabaseClient} from '@supabase/supabase-js';
let client:SupabaseClient|null=null;
export function browserClient(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key)return null;
 if(!client){try{client=createClient(url,key);}catch{return null;}}
 return client;
}
export async function api<T>(path:string,method='GET',body?:unknown):Promise<T>{
 const client=browserClient();if(!client)throw new Error('Connect Supabase before using the application.');
 const {data}=await client.auth.getSession();if(!data.session)throw new Error('Sign in to continue.');
 const response=await fetch(path,{method,headers:{Authorization:`Bearer ${data.session.access_token}`,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined,cache:'no-store'});
 const result=await response.json();if(!response.ok)throw new Error(result.error||'Request failed.');return result;
}
