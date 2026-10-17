export const DEFAULT_GROQ_MODEL = 'openai/gpt-oss-20b';
const ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
const INSTRUCTIONS = 'Explain only the supplied recorded wellness signals. Do not diagnose, predict neurological disease, score brain health, invent causation, or recommend medication. Distinguish a forming daily baseline from an established one. Mention uncertainty, device/practice effects and microphone differences when relevant. Write two short plain-text paragraphs and two gentle everyday suggestions. Do not imply clinical validation. Do not include reasoning or hidden analysis.';
type ProviderResult = {kind: 'ai'; content: string; model: string} | {kind: 'unavailable'; notice: string};
type Config = {key?: string; model?: string};
function unavailable(status: number): ProviderResult {
  const reason = status === 401 ? 'Groq rejected the API key. The owner should update GROQ_API_KEY in Vercel.'
    : status === 403 ? 'Groq denied access. The owner should check project and model permissions.'
    : status === 404 ? 'The configured Groq model is unavailable. The owner should check GROQ_MODEL.'
    : status === 429 ? 'Groq has reached a usage or rate limit. Wait before requesting another AI explanation.'
    : status === 400 ? 'Groq could not accept the configured request. The owner should check model compatibility.'
    : 'Groq is temporarily unavailable. Try again later.';
  return {kind: 'unavailable', notice: `${reason} Your built-in statistical summary remains available.`};
}
export async function generateGroqInsight(summary: unknown, config: Config, fetcher: typeof fetch = fetch): Promise<ProviderResult> {
  const key = config.key?.trim(), model = config.model?.trim() || DEFAULT_GROQ_MODEL;
  if (!key) return {kind: 'unavailable', notice: 'Groq is not configured. Your built-in statistical summary works without an API key.'};
  try {
    const response = await fetcher(ENDPOINT, {
      method: 'POST', headers: {Authorization: `Bearer ${key}`, 'Content-Type': 'application/json'},
      body: JSON.stringify({model, messages: [{role: 'system', content: INSTRUCTIONS}, {role: 'user', content: JSON.stringify(summary)}], max_completion_tokens: 1400, ...(model.startsWith('openai/gpt-oss-') ? {reasoning_effort: 'low', include_reasoning: false} : {})}),
      signal: AbortSignal.timeout(25000),
    });
    // Never echo raw errors, which may contain credentials or private inputs.
    if (!response.ok) return unavailable(response.status);
    const result = await response.json(), choice = result?.choices?.[0];
    const content = typeof choice?.message?.content === 'string' ? choice.message.content.trim() : '';
    if (choice?.finish_reason !== 'stop' || !content || content.length > 5500 || /<\/?(?:think|analysis)>/i.test(content)) return {kind: 'unavailable', notice: 'Groq returned an incomplete or unusable explanation. Your statistical summary is shown instead.'};
    return {kind: 'ai', content, model};
  } catch {
    return {kind: 'unavailable', notice: 'The Groq request timed out or could not be read. Your statistical summary is shown instead.'};
  }
}
