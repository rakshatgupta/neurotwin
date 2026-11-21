'use client';
import Link from 'next/link';
import {useEffect,useState} from 'react';
import {useRouter} from 'next/navigation';
import {browserClient} from '../../lib/supabase';
import {username,displayName} from '../../lib/profile';
export default function Account(){
 const router=useRouter(),[mode,setMode]=useState('login'),[name,setName]=useState(''),[handle,setHandle]=useState(''),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);
 useEffect(()=>{const client=browserClient();if(!client)return;const {data}=client.auth.onAuthStateChange(event=>{if(event==='PASSWORD_RECOVERY')setMode('password');});return()=>data.subscription.unsubscribe();},[]);
 async function submit(e:React.FormEvent){e.preventDefault();if(busy)return;const client=browserClient();if(!client)return;setBusy(true);setMessage('');try{
  if(mode==='reset'){const {error}=await client.auth.resetPasswordForEmail(email.trim(),{redirectTo:`${location.origin}/account/`});if(error)throw error;setMessage('If an account exists, check your email for a reset link.');}
  else if(mode==='password'){const {error}=await client.auth.updateUser({password});if(error)throw error;setMessage('Password updated.');router.push('/home/');}
  else if(mode==='signup'){
   const {data,error}=await client.auth.signUp({email:email.trim().toLowerCase(),password,options:{data:{username:username(handle),display_name:displayName(name)},emailRedirectTo:`${location.origin}/account/`}});
   if(error)throw error;
   if(data.session)router.push('/home/');else setMessage('Your account needs email confirmation because it is still enabled in Supabase. Contact the project owner to enable immediate sign-in.');
  }else{const {error}=await client.auth.signInWithPassword({email:email.trim(),password});if(error)throw error;router.push('/home/');}
 }catch(e){setMessage(e instanceof Error&&/Database error saving new user/i.test(e.message)?'That username may already be taken. Try another username. If this continues, contact the project owner.':e instanceof Error?e.message:'Please try again.');}finally{setBusy(false);}}
 if(!browserClient())return <main className="auth-shell"><section className="auth-card"><Link href="/" className="brand">neurotwin AI</Link><h1>Your workspace is almost ready.</h1><p>Account services are temporarily unavailable. Please contact the project owner or try again later.</p><Link href="/" className="primary-button">Explore the landing page</Link></section></main>;
 return <main className="auth-shell"><form className="auth-card" onSubmit={submit}>
  <Link href="/" className="brand">neurotwin AI</Link>
  <h1>{mode==='signup'?'Create your private workspace.':mode==='reset'?'Reset your password.':mode==='password'?'Choose a new password.':'Welcome back.'}</h1>
  <p>{mode==='signup'?'Keep your records in your account until you choose to delete them.':'Personal wellness patterns, securely connected to your account.'}</p>
  {mode==='signup'&&<><label>Your name<input autoComplete="name" required maxLength={60} value={name} onChange={e=>setName(e.target.value)}/></label><label>Username<input autoComplete="username" required minLength={3} maxLength={24} pattern="[A-Za-z][A-Za-z0-9_]{2,23}" aria-describedby="username-help" value={handle} onChange={e=>setHandle(e.target.value)}/></label><p id="username-help" className="panel-sub">Start with a letter. Use 3–24 letters, numbers or underscores. Usernames are unique regardless of capitalization.</p></>}
  {mode!=='password'&&<label>Email<input type="email" autoComplete="email" required maxLength={254} value={email} onChange={e=>setEmail(e.target.value)}/></label>}
  {mode!=='reset'&&<label>Password<input type="password" autoComplete={mode==='login'?'current-password':'new-password'} required minLength={mode==='login'?1:12} maxLength={128} value={password} onChange={e=>setPassword(e.target.value)}/></label>}
  {mode==='signup'&&<p className="panel-sub">Use an email you control for password recovery and a password of at least 12 characters. Data collection and optional AI processing require separate consent after sign-in.</p>}
  <button className="primary-button" disabled={busy}>{busy?'Please wait…':mode==='signup'?'Create account':mode==='reset'?'Send reset link':mode==='password'?'Save new password':'Sign in'}</button>
  {message&&<p role="status" className="auth-message">{message}</p>}
  <div className="auth-links"><button type="button" disabled={busy} onClick={()=>{setMode(mode==='signup'?'login':'signup');setMessage('');setPassword('');}}>{mode==='signup'?'Already have an account? Sign in':'Create an account'}</button><button type="button" disabled={busy} onClick={()=>{setMode('reset');setMessage('');setPassword('');}}>Forgot password?</button><Link href="/home/">Open my workspace</Link></div>
 </form></main>;
}
