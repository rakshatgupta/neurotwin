# NeuroTwin AI

Next.js 15, React 19, Tailwind 4, Supabase Auth/Postgres, and an optional OpenAI Responses integration.

The landing page keeps the animated head and clickable brain. The account workspace supports:

- Email/password sign-up, confirmation, sign-in, recovery, and logout.
- Consent-based daily sleep, movement, stress, and mood records.
- Five-trial reaction-time and three-round digit-recall tasks.
- CSV imports of daily wearable summaries.
- Optional microphone duration/recording-level extraction without storing or uploading raw audio.
- Adaptive per-user rolling baselines, robust deviation detection, multimodal fusion, sleep trends, and simple continuation estimates.
- Consent-gated AI explanations generated on the server, with persistent database rate limiting.
- Record export, atomic record deletion, and optional permanent account deletion.

## Run

```sh
npm ci
# Copy .env.example to .env.local and configure it.
npm run dev
npm test
npm run build
npm start
```

Without Supabase configuration the landing page works, while the workspace displays setup instructions. No sample health data is presented as real user data. API routes verify the authenticated identity and the database enforces per-user row access. Public project configuration is distinct from privileged keys, which stay on the server.

Read [DEPLOYMENT.md](DEPLOYMENT.md) to configure Supabase and deploy from GitHub to Vercel. GitHub Pages is no longer the application’s deployment target. The database migration and isolation suite are in `supabase/`. Unit tests are in `tests/core.test.mjs`; authenticated endpoint guards can be checked with `tests/http-check.mjs` against a running application.

## Research scope

This application supports non-diagnostic awareness. The baseline algorithm is statistical, not a clinically trained neurological predictor. AI text explains recorded patterns without asserting causation or diagnosis. Cognitive scores depend on device and practice. Direct wearable OAuth and clinical model training are outside this implementation; optional wearable data enters through validated CSV imports.
