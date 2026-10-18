# NeuroTwin implementation audit — 18 October 2026

## Scope and evidence

Audited the existing Next.js/React/Tailwind project rather than replacing it: landing and head interaction, account flows, all workspace tabs and forms, analytic libraries, authenticated APIs, Supabase migrations/policies, Groq and prediction integrations, research artifacts, styles and tests. Preserved branding, head artwork, existing data and technology stack. Two untracked downloaded notebooks were left unchanged.

The checklist statuses below describe repository functionality verified with local calculations, actual React interactions with mocked auth/API boundaries, disposable PostgreSQL migrations/policies, and production-server HTTP checks. They do **not** claim a fresh authenticated test of the deployed Supabase/Vercel project. Production activation is **Partial** until migration 004 is applied and the branch is deployed. The agent did not access private credentials, send real health records to a provider, create real accounts or delete production records.

## Before this audit

Already implemented: animated landing/head/brain entry; account registration, confirmation, sign-in/out and password recovery; private daily records; cognitive tasks with context; optional local voice extraction; CSV imports; rolling median/MAD references; historical reconstruction; current freshness filtering; rule-based and optional Groq summaries; real-data Ridge predictions and later-outcome matching; research evaluation and exploratory feature selection; consent, export, wellness deletion and optional account deletion.

Found incomplete or inconsistent:

- No saved processing-run provenance or preserved historical findings after an input edit. History was reconstructed from retained inputs only.
- No bedtime/wake-time/sleep-quality fields and no explicit load/edit action for a historical check-in.
- Voice values could be saved but had no dedicated history display.
- AI summaries unnecessarily required a daily record even when cognitive/voice history existed.
- Latest cognitive/voice references could include equal-timestamp observations, unlike the strictly-earlier historical reconstruction.
- Guidance was mostly generic rather than tied to the particular recent flagged signals.
- Interrupted/hidden-page assessments and recordings needed explicit handling.
- A successful save followed by a failed refresh could be presented as a failed save, encouraging duplicate assessment submission.
- Assessment text still said predictions were not enabled. Landing access relied mostly on discovering the brain interaction.
- Existing HTTP checks omitted prediction/twin endpoints; interaction checks were not comprehensive.

## Added and repaired

1. Optional local bedtime, wake time and 1–5 self-reported sleep quality, client controls, server validation and database checks. No duration inferred from clock times. Existing CSV format remains valid and does not fabricate these fields.
2. Daily history Edit loads stored values for review; selecting an existing date also loads them. Saving updates that date. Measured cognitive/voice results remain recorded sessions; retaking a task appends a new observation rather than rewriting a prior prediction outcome.
3. Private `twin_updates` records: server-computed dataset fingerprint, algorithm version, processing time, modality counts, source-record references, baseline factors, combined variation and up to 100 historical flags. Duplicate unchanged datasets are not repeatedly inserted. These are self-report research snapshots, not tamper-proof clinical audit records.
4. Latest saved update and expandable processing/deviation history in Overview and My baseline. Current live calculations remain separate from saved snapshots. Snapshot failures are shown without falsely claiming processing was saved.
5. Numeric voice history, including date, duration and level. Optional voice remains unnecessary for other analyses; no raw audio storage/upload.
6. Cognitive/voice-only statistical and optional provider explanations; insufficient reference history remains explicit.
7. Strictly earlier cognitive/voice reference inputs, aligning current and historical calculations. Existing minimum history, variance floors, deviation threshold and freshness policy retained.
8. Signal-specific rule-based wellness suggestions, always available without Groq, with non-diagnostic limitations and appropriate general follow-up wording.
9. Hidden-page cognitive tasks restart; hidden-page recordings stop and discard the interrupted feature calculation. Microphone tracks and audio contexts are cleaned up.
10. Successful saves are not reported as unsaved solely because refreshing the dashboard failed.
11. Visible workspace link on the existing landing page, updated assessment instructions, accessible mind-state grouping, focus styles and wrapping for long source references.

## Major files

- `app/home/page.tsx`: edit/preload flow, optional sleep fields, processing status, voice history and save-state repair.
- `components/TwinUpdateStatus.tsx`: saved-update provenance, snapshot history and recoverable errors.
- `lib/twinSnapshot.ts`: server-side reproducible snapshot computation/fingerprint.
- `app/api/twin/route.ts`: authenticated processing and owner-scoped history.
- `supabase/migrations/004_twin_updates_and_sleep_patterns.sql`: additive fields, update timestamps, private snapshots, policies and deletion integration.
- `lib/validation.ts`, `lib/types.ts`, `app/api/data/route.ts`: validated collection and retrieval.
- `app/api/export/route.ts`: snapshot export; account cascade and wellness deletion include snapshot removal.
- `lib/analytics.ts`, `lib/insights.ts`, `lib/guidance.ts`, `components/TwinProgress.tsx`, `app/api/insights/route.ts`, `components/PersonalizedInsight.tsx`: coherent analysis, available-data insights and derived guidance.
- `components/CognitiveTest.tsx`, `components/VoiceCheck.tsx`: interrupted-task handling and accurate instructions.
- `app/page.tsx`, `app/workspace.css`: entry accessibility and minimal style repairs.
- `tests/audit-pipeline.test.mjs`, `tests/twin-route.test.mjs`, expanded database/interaction/HTTP checks: actual verification.

## Core-functionality checklist

| Functionality | Status | Verified implementation |
|---|---|---|
| Multimodal collection | Complete | Manual/CSV records, optional sleep patterns, recorded cognitive tasks, optional numeric voice, dated history/edit, client/server/database validation |
| Adaptive personal digital twin | Complete | Personal rolling reference recomputes from observations; recorded input-dependent updates and historical source references; readiness and insufficient-history states |
| Multimodal deviations and trends | Complete | Robust personal departures, compatible recent-signal combination, strict earlier history, saved/reconstructed timelines, dated factors and missing-modality handling |
| Dashboard and personalized insight engine | Complete | Stored-data charts, baseline comparisons, rule-based data-dependent guidance, optional authenticated Groq explanations, experimental personal forecasts and outcome evaluation |

Complete means implemented and locally verified—not clinically validated and not automatically activated in the owner's cloud project. Optional live external services remain subject to setup below.

## Nine-stage pipeline checklist

| Stage | Status | Connection to actual processing |
|---|---|---|
| 1. Collection | Complete | Validated authenticated writes to account-owned tables |
| 2. Preprocessing | Complete | Type/range/date checks, atomic CSV validation, ordered histories, nullable optional context and missing-data guards |
| 3. Feature selection | Complete | Runtime evidence/availability rules select eligible channels; separate executed grouped-validation feature-set experiment is documented as exploratory |
| 4. Multimodal fusion | Complete | Mean capped absolute robust departures from eligible recent channels; dated inputs/coverage disclosed; unavailable channels omitted |
| 5. Personal baseline creation | Complete | Rolling 30-observation median/MAD with minimum evidence and variance floors |
| 6. Twin updating | Complete | New/edited inputs produce new computed profiles and distinct saved snapshots when the workspace refreshes with consent |
| 7. Trend/deviation detection | Complete | Latest and historical strictly-earlier comparisons, sleep trend/experimental continuation, documented 2.5-spread flag rule |
| 8. Explainable insights | Complete | Statistical summaries and signal-specific suggestions derived from results; optional provider requests use only the owner's summarized data and versioned consent |
| 9. Visualization/evaluation | Complete | Actual-record charts/timelines; offline real-data comparisons, exploratory feature-selection scores and prospective personal forecast errors kept distinct from clinical evidence |

The reference model stays fixed; personal retraining is **Not implemented**, not a claimed capability. No disease predictor, validated brain-health score or clinical validation is implemented. Direct wearable OAuth is **Not implemented**; optional wearable file import is implemented. Research publication and patent filing are separate external outcomes.

## Tests executed and actual results

- `node --experimental-strip-types --test tests/*.test.mjs`: **53 passed**. Validation, optional data, baseline leakage/windowing, equal timestamps, freshness, source fingerprints/edits, cognitive-only insights, rule guidance, consent, provider fallback, owner-scoped prediction and snapshot routes.
- `node tests/prediction-database.check.mjs`: **27 passed** in disposable PGlite PostgreSQL with simulated Supabase roles/auth. Migrations 001–004 and repeatability, actual persistence, checks, ownership, anonymous denial, consent, coefficient parity, forecast matching/invalidation/expiry, snapshot update denial and deletion isolation. This is not a live Supabase or concurrency-stress test. Original pgTAP suite is not represented as freshly executed.
- `node tests/workspace-interactions.check.mjs`: **35 passed** using actual React components and mocked auth/API. All workspace navigation and research entry, overview chart selector, historical chart selector/filter, check-in edit/save, full five-trial/three-round recall flow/save, interrupted assessment, simulated microphone feature capture/cleanup, prediction eligibility/error state, export, consent, disabled controls, deletion and sign-out.
- `node tests/http-check.mjs http://127.0.0.1:3041`: **10 protected operation checks + 3 public-page checks passed** against the local production server. Signed-out APIs return 401 and no-store; public pages return 200.
- `node node_modules/typescript/bin/tsc --noEmit`: passed.
- `npm run build`: passed. Includes `/api/twin/` and existing routes.
- No lint script/configuration exists; no lint result is claimed.
- Desktop/mobile baseline layout reviewed in a local synthetic-data render of the actual components: no document overflow at 1280px or 390px. This is layout evidence, separate from the interactive React checks and live-cloud acceptance.

## Manual setup and remaining verification

1. In the existing Supabase project's SQL Editor, apply **only migration 004** after previously applied 001–003. Do not rerun 001 on an existing database. Migration 004 is additive/repeatable, retains records, and replaces the deletion function to include snapshots. Existing records' new optional fields remain null; initial `updated_at` for old rows is migration time, not an invented original measurement time.
2. Deploy this branch to Preview with the existing Supabase public configuration. Production changes only after review/merge. No new API key or paid service is required.
3. Save/edit a check-in with optional sleep fields; refresh and check it in history. Check Latest saved twin update and its source counts/references. Edit the entry again and confirm a new snapshot appears and the earlier snapshot retains its computed findings.
4. Verify the cloud snapshot history is isolated between two accounts. Export and delete a disposable account's wellness data; confirm snapshots/predictions are included/removed and another account remains unchanged.
5. Recheck actual browser microphone permission/capture and live email confirmation/recovery. They were not newly exercised through real devices/SMTP in this audit. The owner previously reported functioning email/account flows, voice persistence and isolation.
6. Groq explanations require the existing private server key and saved/per-request consent. Actual provider delivery/quotas were not called in this audit. Statistical insights and rule guidance remain independent of Groq.
7. Direct device integrations, clinical validation and proof of predictive superiority remain outside the verified prototype. The ten-split Ridge result still did not consistently beat the recent-average baseline. Do not claim otherwise.

**Production activation/acceptance: Partial** until the owner performs these cloud steps. Repository implementation is complete for the four specified prototype capabilities and nine processing stages within the documented scope.

## Local run and test (PowerShell)

```powershell
cd 'C:\Users\raksh\OneDrive\Documents\Playground\neurotwin'
npm ci
if (!(Test-Path -LiteralPath '.env.local')) {
    Copy-Item -LiteralPath '.env.example' -Destination '.env.local'
}
```

Privately set the two Supabase public values in `.env.local`; point them to a development/disposable project with migrations 001–004 applied. Optional server Groq/admin keys stay in local/Vercel secret settings, never GitHub or chat. A preview using the production Supabase project writes real account data; use disposable accounts for testing.

```powershell
npm test
npm run build
npm run dev
```

Open `http://localhost:3000`, sign in and use the workspace. Without configuration the public landing and explanatory account page still load; authenticated persistence is not simulated as real cloud functionality.

Optional extended local checks require QA-only packages, not production dependencies:

```powershell
npm install --prefix .taste-skill/prediction-check @electric-sql/pglite
npm install --prefix .taste-skill/ui-check jsdom
node tests/prediction-database.check.mjs
node tests/workspace-interactions.check.mjs
```

For HTTP checks, run `npm start -- --hostname 127.0.0.1 --port 3041` in one terminal after building, then `node tests/http-check.mjs http://127.0.0.1:3041` in another. No real credentials are needed for signed-out guards.
