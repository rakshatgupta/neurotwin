import type {buildTwin} from './analytics';
import type {Preferences} from './types';

// Old OpenAI consent does not authorize sending records to a new provider.
export const GROQ_CONSENT_VERSION = 'groq-2026-10-17';
export function hasGroqConsent(value: Preferences & {consent_version?: string}) {
  return value.storage_consent && value.ai_consent && value.consent_version === GROQ_CONSENT_VERSION;
}
export function statisticalInsight(twin: ReturnType<typeof buildTwin>) {
  if (!twin.latest&&!twin.assessmentSessions&&!twin.voiceRecordings) return 'Save a daily check-in to start your statistical summary, or complete an optional assessment. No data is sent to an AI provider.';
  const latest = twin.latest;
  const lines = latest?[`Your latest daily record is dated ${latest.on_date}: ${latest.sleep} hours of sleep, ${latest.activity} minutes of movement and stress ${latest.stress}/10.`]:[`No daily check-in is available. Your history contains ${twin.assessmentSessions} cognitive sessions and ${twin.voiceRecordings} optional voice recordings. These are analyzed independently of missing daily inputs.`];
  if(!latest&&!twin.factors.length)lines.push('Four cognitive sessions or four voice recordings with strictly earlier timestamps are needed for their first reference comparison.');
  if(latest&&(latest.bed_time||latest.wake_time||latest.sleep_quality!=null))lines.push(`Reported local sleep pattern: bedtime ${latest.bed_time?.slice(0,5)||'not recorded'}, wake time ${latest.wake_time?.slice(0,5)||'not recorded'}, self-reported quality ${latest.sleep_quality==null?'not recorded':`${latest.sleep_quality}/5`}. Clock times do not establish actual sleep duration.`);
  if (latest && twin.status === 'forming') lines.push(`${twin.checkinDays} distinct daily record${twin.checkinDays === 1 ? '' : 's'} available. Eight recorded days are needed for the first daily baseline comparison.`);
  if (twin.factors.length) {
    const changes = twin.deviations.map(f => `${f.name} is ${f.latest.toFixed(2)} ${f.unit}, compared with a personal median of ${f.baseline.toFixed(2)} ${f.unit} (${Math.abs(f.deviation).toFixed(2)} reference spreads ${f.deviation < 0 ? 'below' : 'above'} the median)`);
    lines.push(changes.length ? `Relative changes in the available signals: ${changes.join('; ')}.` : 'None of the eligible signals crosses the implemented relative-change threshold. This is a statistical observation, not a health assessment.');
  }
  if (twin.sleepTrend !== null) lines.push(`The recorded sleep trend is ${twin.sleepTrend.toFixed(3)} hours per calendar day over the available recent history. Co-occurring changes do not establish a cause.`);
  if(twin.factors.some(f=>!f.fresh))lines.push('Some eligible readings are older than the seven-day display window or future-dated. They remain historical comparisons but are excluded from current combined variation.');
  lines.push('Keep recording under comparable conditions and review changes over time. Cognitive results depend on device and practice; recording levels depend on the microphone and surroundings. This summary cannot diagnose or rule out a medical condition.');
  return lines.join('\n\n');
}
