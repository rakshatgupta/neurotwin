import type {buildTwin} from './analytics';
export function wellnessActions(twin:ReturnType<typeof buildTwin>) {
 const actions:string[]=[];
 for(const factor of twin.currentDeviations){
  if(factor.name==='Sleep')actions.push(factor.deviation<0?'Sleep is below your recorded reference. Review the entry and consider a consistent sleep routine; this does not explain why it changed.':'Sleep is above your recorded reference. Check the recorded duration and consider recent routine changes.');
  if(factor.name==='Stress')actions.push(factor.deviation>0?'Reported stress is above your reference. Consider a short break or a manageable calming activity, and review repeated entries.':'Reported stress differs below your reference. Review the context rather than treating a statistical difference as a problem.');
  if(factor.name==='Activity')actions.push('Activity differs from your reference. Check the units and consider whether your recent routine changed. Choose movement that is comfortable for you.');
  if(factor.name==='Reaction time'||factor.name==='Recall accuracy')actions.push(`${factor.name} differs from your reference. Compare later sessions using the same device and a quiet setting; attention and practice affect these tasks.`);
  if(factor.name==='Recording level')actions.push('Recording level differs from your reference. Check microphone distance, hardware and background sound before comparing it. This is not a neurological marker.');
 }
 return actions;
}
