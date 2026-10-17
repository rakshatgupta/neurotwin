# Deploy the full NeuroTwin application

The project now contains server routes. Deploy the source from GitHub to **Vercel**, with **Supabase** for accounts and Postgres. GitHub Pages cannot run these authenticated API routes. The old Pages workflow has been replaced with build/test CI. The previously published Sites URL remains the earlier landing-page/demo version until a full application is deployed elsewhere.

## 1. Create and prepare Supabase

1. Create a project at https://supabase.com/dashboard. Keep the database password in your password manager.
2. Open **SQL Editor**, create a query, paste the entire contents of `supabase/migrations/001_neurotwin.sql`, and run it **once** on the new project. This creates the tables, per-account RLS policies, consent constraints, atomic deletion, and AI usage limits.
3. From the project **Connect** dialog, copy the **Project URL** and **Publishable key**. These are public application configuration; access is protected by authentication and RLS.
4. To enable permanent account deletion, obtain the legacy **service_role** key under the project’s API keys settings. This is privileged: put it only in the server environment variable `SUPABASE_SERVICE_ROLE_KEY`.
5. Under **Authentication > URL Configuration**, set the Site URL to your final Vercel URL and add `https://YOUR-APP.vercel.app/account/` as an allowed redirect URL. For local development also add `http://localhost:3000/account/`. Use your actual application URLs, not the placeholders.
6. Keep email confirmation enabled. Configure SMTP under Authentication for public launch, and verify sign-up and password-reset delivery with your own test accounts.

## 2. Push the source to GitHub

Create an empty GitHub repository named `neurotwin`. Then run in PowerShell:

```powershell
cd 'C:\Users\raksh\OneDrive\Documents\Playground\neurotwin'
git add .
git commit -m "Complete NeuroTwin application"
git branch -M main
git remote add github https://github.com/YOUR-USERNAME/neurotwin.git
git push -u github main
```

If the `github` remote already exists, replace `remote add` with `git remote set-url github https://github.com/YOUR-USERNAME/neurotwin.git`. If the commit says there is nothing to commit, continue with the push. Never add `.env.local`; it is ignored. No API keys belong in GitHub source.

## 3. Connect Vercel and configure the application

1. Sign into https://vercel.com and choose **Add New > Project**.
2. Import the `neurotwin` GitHub repository. Framework: **Next.js**. Root directory: the repository root. Keep default build/output settings. Node.js 22 is suitable for the included CI/test command.
3. Before deployment, add these environment variables to Production and to any Preview/Development environments you intend to use:

| Variable | Value | Visibility |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Public |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Your Supabase publishable key | Public |
| `GROQ_API_KEY` | Your Groq API key; optional | Server only |
| `GROQ_MODEL` | `openai/gpt-oss-20b` (default), or a compatible available chat model | Server only |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service-role key | Server only; enables account deletion |

4. Deploy. Copy the resulting Vercel URL into Supabase’s Site URL and allowed redirects as described above. Redeploy after changing public environment variables, since Next.js includes them in client bundles at build time.
5. Open `/account/`, create an account, confirm the email, and sign in. Open Privacy & data and save your consent choices before adding records.

Without a Groq key, the built-in statistical summary works directly in the browser. Optional AI explanations require Groq configuration. Legacy `OPENAI_API_KEY` and `OPENAI_MODEL` variables are unused by this version. The privileged Supabase key is only needed for permanent sign-in-account deletion; record deletion uses the user’s own authenticated session.

## 4. Verify before inviting users

Use two disposable accounts. Confirm that each account sees only its own data, including when calling Supabase directly. Verify sign-up, confirmation, login, password reset, and logout. Test consent withdrawal, check-in update, CSV import, cognitive sessions, optional voice capture, data export, data deletion, and account deletion.

The database isolation suite is `supabase/tests/rls.sql`. Run it against a disposable/local project after the migration (using Supabase SQL Editor or `supabase test db` with a local setup). It creates test-only fixtures inside a transaction, checks authorization and consent policies, and rolls back. The suite should produce 15 passing tests. Do not use a project containing matching fixture IDs.

For live AI verification, save a synthetic check-in and review/save the new Groq consent in Privacy & data. Previous OpenAI consent is not accepted for the new provider. Select the request-specific checkbox and generate an explanation. The app sends summarized wellness signals to Groq, not email, account ID or raw audio. Groq data policies apply. The per-account limit is 10 attempts per UTC day, at least one minute apart. Provider failures still count as attempts. Missing keys, quota errors, invalid responses and network failures leave the clearly labelled statistical summary available; failed responses are not stored as AI explanations. Previously saved explanations retain their original text and timestamp. No new SQL migration is needed. See GROQ_SETUP.md for the exact configuration steps.

## Local development

```powershell
Copy-Item .env.example .env.local
# Fill .env.local using your project configuration. Keep secrets out of chat and Git.
npm ci
npm test
npm run dev
```

Open the printed localhost URL. After `npm run build`, use `npm start` to test a production build. `node tests/http-check.mjs http://127.0.0.1:3000` verifies public-page availability and rejection of signed-out private API requests.

## Ongoing deployment

Vercel republishes the production app on pushes to the connected production branch. GitHub Actions runs the included unit tests and production build. Enable GitHub branch protection with the CI check if you want to require it before merging. Configure monitoring and backup/retention preferences in your Supabase and Vercel accounts.

## Practical boundaries

This is a research wellness application, not a clinically validated neurological device. Its adaptive baseline uses rolling medians/MAD and optional generative explanations; there is no trained disease-prediction model. Sleep continuation estimates are simple historical regressions with rough variability bands, not calibrated clinical forecasts. Cognitive tasks are device-sensitive. Voice analysis extracts only recording duration/level. Wearable input uses validated CSV summaries; vendor-specific OAuth integrations are not included.

Dashboard history shows the latest 365 daily records and 100 cognitive/voice sessions. Export retrieves retained records with pagination, up to 20,000 rows per table and a 3 MB response. Larger exports require the project owner’s database export tooling. AI usage counters remain after wellness-data deletion to enforce limits, and are removed with account deletion.

## Official documentation

- https://supabase.com/docs/guides/getting-started/quickstarts/nextjs
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://vercel.com/docs/frameworks/full-stack/nextjs
- https://console.groq.com/docs/openai
- https://console.groq.com/docs/rate-limits
- https://console.groq.com/docs/your-data
