import type {Dataset} from './types';
import {isFresh} from './analytics';
export function dataReadiness(data:Dataset,now=Date.now()) {
 const tests=[...data.assessments].sort((a,b)=>a.created_at.localeCompare(b.created_at));
 const latest=tests.at(-1),days=[...data.checkins].sort((a,b)=>a.on_date.localeCompare(b.on_date));
 const voices=[...data.voices].sort((a,b)=>a.created_at.localeCompare(b.created_at));
 const context=tests.filter(a=>a.protocol_version==='neurotwin-five-trial-v1'&&a.hours_awake!=null&&a.sleepiness_score!=null&&a.assessment_started_at&&a.utc_offset_minutes!=null);
 const latestHasContext=!!latest&&context.includes(latest);
 const start=Date.parse(latest?.assessment_started_at||'');
 const predictionReady=latestHasContext&&context.length>=3&&start<=now&&now-start<48*3600000&&latest!.hours_awake!<=24;
 return [
  {name:'Daily baseline',count:days.length,needed:8,latest:days.at(-1)?.on_date,status:days.length>=8?'Reference ready':'Forming',detail:'Eight distinct dates establish the first daily comparison.'},
  {name:'Cognitive baseline',count:tests.length,needed:4,latest:latest?.created_at,status:tests.length>=4?'Reference ready':'Forming',detail:'Four sessions establish the first reaction and recall comparison.'},
  {name:'Personal predictions',count:context.length,needed:3,latest:latest?.assessment_started_at||undefined,status:predictionReady?'Ready to request':'More context needed',detail:predictionReady?'A recent context-bearing session is available; the server confirms eligibility.':!latestHasContext?'Complete a new assessment with hours awake and sleepiness.':context.length<3?'Three context-bearing sessions are required.':'Complete a recent session within 48 hours, with hours awake at most 24.'},
  {name:'Voice reference (optional)',count:voices.length,needed:4,latest:voices.at(-1)?.created_at,status:!data.preferences.voice_consent?'Optional / off':voices.length>=4?'Reference ready':'Forming',detail:'Four recordings establish a recording-level reference; this is not a neurological marker.'},
 ].map(row=>({...row,fresh:row.latest?isFresh(row.latest,now):false}));
}
