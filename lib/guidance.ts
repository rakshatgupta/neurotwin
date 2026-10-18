import type {buildTwin} from './analytics';
export type PracticalStep={id:string;title:string;reason:string;action:string;source:string;href?:string};
export function practicalNextSteps(twin:ReturnType<typeof buildTwin>,now=Date.now()):PracticalStep[]{
 const result:PracticalStep[]=[];
 const recent=twin.latest&&now-Date.parse(twin.latest.on_date)>=0&&now-Date.parse(twin.latest.on_date)<=7*86400000?twin.latest:null;
 if(recent?.sleep===0)result.push({id:'verify-sleep',title:'Check your sleep entry first',reason:`Your ${recent.on_date} entry reports 0 hours of sleep.`,action:'If this was a test value or a recording mistake, edit that day using your actual sleep duration. Confirm the entry before acting on its sleep comparison.',source:'Recorded value; a data-quality check, not a diagnosis.'});
 for(const f of twin.currentDeviations){
  if(f.name==='Sleep'&&recent?.sleep===0)continue;
  const difference=Math.abs(f.latest-f.baseline).toFixed(f.unit==='RMS'?3:1),unit=f.unit==='%'?'percentage points':f.unit==='/10'?'rating points':f.unit;
  const reason=`${f.name}: ${f.latest.toFixed(f.unit==='RMS'?3:1)} ${f.unit} on ${f.recordedAt.slice(0,10)} — ${difference} ${unit} ${f.deviation<0?'below':'above'} your usual ${f.baseline.toFixed(f.unit==='RMS'?3:1)} ${f.unit}.`;
  const source='Based on a recent change outside your recorded personal range; no cause is established.';
  if(f.name==='Sleep')result.push({id:'sleep',title:f.deviation<0?'Plan a calmer bedtime':'Keep your sleep routine consistent',reason,action:f.deviation<0?'Choose a consistent bedtime and wake time. Tonight, try a quiet wind-down and switch off screens at least 30 minutes before bed.':'Check whether this was actual sleep or time in bed. Keep a consistent bedtime and wake time rather than deliberately reducing sleep to match a score.',source,href:'https://www.cdc.gov/sleep/about/'});
  if(f.name==='Stress')result.push({id:'stress',title:f.deviation>0?'Take a calming break':'Keep what is helping',reason,action:f.deviation>0?'Set aside five minutes for gentle, comfortable breathing without forcing it. Choose one manageable task to focus on afterward.':'If the lower rating reflects how you feel, keep the routines you find helpful. A lower stress rating alone does not need correcting.',source,href:'https://www.nhs.uk/mental-health/self-help/guides-tools-and-activities/breathing-exercises-for-stress/'});
  if(f.name==='Activity'||f.name==='Steps'){
   const id='movement';if(result.some(r=>r.id===id)){const existing=result.find(r=>r.id===id)!;existing.reason+=' '+reason;continue;}
   result.push({id,title:f.deviation<0?'Try a comfortable movement break':'Check the change in movement',reason,action:f.deviation<0?'If it suits your abilities, try a short, comfortable walk or another movement you enjoy. Start small rather than trying to make up the whole difference in one day.':'Check that the count or minutes are correct and reflect your actual day. Choose a comfortable routine; more movement is not automatically a better score.',source,href:'https://www.nhs.uk/live-well/exercise/walking-for-health/'});
  }
  if(f.name==='Reaction time'||f.name==='Recall accuracy'){
   const worse=f.name==='Reaction time'?f.deviation>0:f.deviation<0;
   result.push({id:f.name,title:worse?'Pause before your next cognitive check':'Keep the comparison consistent',reason,action:worse?'Take a break before testing again. On another occasion, try a quiet setting and the same device. Do not repeatedly retest to chase your previous result.':'Keep using comparable conditions when you next test. Practice can change results, so this is not evidence that your brain health improved.',source});
  }
  if(f.name==='Recording level')result.push({id:'voice',title:'Check your microphone setup',reason,action:'Next time, use the same microphone, distance and quiet setting. Recording amplitude alone does not call for a health-related action.',source:'A recording-condition check, not a voice or neurological diagnosis.'});
 }
 if(!result.length&&recent){
  if(twin.status==='forming')result.push({id:'forming',title:'Build your personal comparison',reason:`You have ${twin.checkinDays} recorded days; eight are needed for the first daily comparison.`,action:'Continue adding genuine check-ins on different days. Until there is enough history, the app cannot select an action from a change in your usual sleep, stress or activity.',source:'Insufficient baseline history; no abnormality inferred.'});
  else result.push({id:'steady',title:'Keep a routine that works for you',reason:'None of your eligible recent readings crossed the implemented change threshold.',action:'Continue your usual routine if it suits you. There is no new flagged change that calls for a different habit; use your own symptoms and concerns rather than this result to decide whether to seek advice.',source:'No flagged change is not proof of good health.'});
 }
 if(!result.length)result.push({id:'missing',title:'Add a recent observation',reason:'There is no recent flagged comparison or recent daily entry to base a practical action on.',action:'Add a genuine daily check-in or, if you choose, a cognitive assessment. Older results remain in history; they are not treated as today’s condition.',source:'Missing or older data; no personalized habit change inferred.'});
 return result;
}
export function wellnessActions(twin:ReturnType<typeof buildTwin>) {
 const actions:string[]=[];
 for(const factor of twin.currentDeviations){
  if(factor.name==='Sleep')actions.push(factor.deviation<0?'Sleep is below your recorded reference. Review the entry and consider a consistent sleep routine; this does not explain why it changed.':'Sleep is above your recorded reference. Check the recorded duration and consider recent routine changes.');
  if(factor.name==='Stress')actions.push(factor.deviation>0?'Reported stress is above your reference. Consider a short break or a manageable calming activity, and review repeated entries.':'Reported stress differs below your reference. Review the context rather than treating a statistical difference as a problem.');
  if(factor.name==='Activity')actions.push('Activity differs from your reference. Check the units and consider whether your recent routine changed. Choose movement that is comfortable for you.');
  if(factor.name==='Steps')actions.push('Your recorded steps differ from your usual count. Check the source and your routine; choose comfortable movement rather than chasing a target.');
  if(factor.name==='Reaction time'||factor.name==='Recall accuracy')actions.push(`${factor.name} differs from your reference. Compare later sessions using the same device and a quiet setting; attention and practice affect these tasks.`);
  if(factor.name==='Recording level')actions.push('Recording level differs from your reference. Check microphone distance, hardware and background sound before comparing it. This is not a neurological marker.');
 }
 return actions;
}
