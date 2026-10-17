import type {buildTwin} from './analytics';
import type {Preferences} from './types';

// Old OpenAI consent does not authorize sending records to a new provider.
export const GROQ_CONSENT_VERSION = 'groq-2026-10-17';
export function hasGroqConsent(value: Preferences & {consent_version?: string}) {
  return value.storage_consent && value.ai_consent && value.consent_version === GROQ_CONSENT_VERSION;
}
export function statisticalInsight(twin: ReturnType<typeof buildTwin>) {
  if (!twin.latest) return 'Save a daily check-in to start your statistical summary. No data is sent to an AI provider.';
  const latest = twin.latest;
  const lines = [`Your latest daily record is dated ${latest.on_date}: ${latest.sleep} hours of sleep, ${latest.activity} minutes of movement and stress ${latest.stress}/10.`];
  if (twin.status === 'forming') lines.push(`${twin.checkinDays} distinct daily record${twin.checkinDays === 1 ? '' : 's'} available. Eight recorded days are needed for the first daily baseline comparison.`);
  if (twin.factors.length) {
    const changes = twin.deviations.map(f => `${f.name} is ${f.latest.toFixed(2)} ${f.unit}, compared with a personal median of ${f.baseline.toFixed(2)} ${f.unit} (${Math.abs(f.deviation).toFixed(2)} reference spreads ${f.deviation < 0 ? 'below' : 'above'} the median)`);
    lines.push(changes.length ? `Relative changes in the available signals: ${changes.join('; ')}.` : 'None of the eligible signals crosses the implemented relative-change threshold. This is a statistical observation, not a health assessment.');
  }
  if (twin.sleepTrend !== null) lines.push(`The recorded sleep trend is ${twin.sleepTrend.toFixed(3)} hours per calendar day over the available recent history. Co-occurring changes do not establish a cause.`);
  lines.push('Keep recording under comparable conditions and review changes over time. Cognitive results depend on device and practice; recording levels depend on the microphone and surroundings. This summary cannot diagnose or rule out a medical condition.');
  return lines.join('\n\n');
}
