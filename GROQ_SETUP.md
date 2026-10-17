# Enable free statistical summaries and optional Groq explanations

## 1. Deploy this code first

Push the updated source to the GitHub main branch connected to Vercel. Wait for its new production deployment to show Ready. Merely redeploying the earlier commit will not add Groq support.

Open `/home/`, sign in, and save a daily check-in. Under Overview → Personalized insight, the **Built-in statistical summary** works without an AI key. It runs in the browser from the records already loaded for your account, makes no external AI request, and is explicitly not AI-generated text.

## 2. Create a Groq key for optional AI

1. Open https://console.groq.com and sign in or create an account.
2. Open API Keys (https://console.groq.com/keys).
3. Choose Create API Key, name it NeuroTwin, and copy it privately.
4. Keep the Free plan if offered for your account. Review your account's model access and limits at https://console.groq.com/settings/limits. Free quotas are limited and may change; do not assume unlimited use.
5. Review Groq's data controls at https://console.groq.com/docs/your-data. Use synthetic demonstration records while validating the integration.

Do not share the key in chat, screenshots, GitHub, or browser-side configuration.

## 3. Add the server configuration in Vercel

Open Vercel → neurotwin → Settings → Environment Variables. Add:

| Name | Value | Environment |
| --- | --- | --- |
| GROQ_API_KEY | Your private Groq API key | Production |
| GROQ_MODEL | openai/gpt-oss-20b | Production |

The model is hosted by Groq even though its model ID begins with `openai/`; it does not use your OpenAI API balance. Its availability depends on your Groq account. You can choose another compatible model listed at https://console.groq.com/docs/models.

The previous OPENAI_API_KEY and OPENAI_MODEL settings are no longer read. They can be removed from Vercel after checking that no other application uses them. Keep the Supabase settings unchanged.

Save, then open Deployments → latest deployment → ⋯ → Redeploy. Wait for Ready and refresh NeuroTwin.

## 4. Review consent and generate

1. Sign in and open Privacy & data.
2. Keep storage consent enabled. Review and enable the Groq-specific AI consent, then Save consent choices. Existing OpenAI consent appears off for Groq until reviewed.
3. Open Overview → Personalized insight.
4. Check that a daily record is saved. Your statistical summary should already be visible.
5. Select the checkbox to send summarized signals to Groq for this request.
6. Click Generate AI explanation once.
7. Success shows “Groq explanation saved” and a Last saved AI explanation with Groq/model provenance. Refresh to confirm persistence.

If the key is invalid, the model is unavailable, or a quota is reached, the page explains the category and keeps the statistical summary available. It does not label fallback text as AI-generated. No provider key means no provider request. App limits are 10 AI attempts per UTC day, at least one minute apart, including failed provider attempts.

## 5. Database and verification

No database migration is required. The existing preferences.consent_version field records provider consent. Existing record ownership, export and deletion continue to apply. Generated text is saved only after rechecking consent; statistical fallback text is calculated on demand rather than inserted into the AI history.

Local automated checks use synthetic inputs and mocked provider responses. A real Groq request and real Supabase persistence must be verified after your private configuration is added. Previous report/video wording that names OpenAI as the inference provider should be updated to Groq; built-in summaries must be described as statistical explanations.
