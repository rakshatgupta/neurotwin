# Feature-list audit and completion — 18 October 2026

## What NeuroTwin actually does

NeuroTwin stores your daily sleep, movement minutes, optional step counts, reported stress and optional sleep-pattern details. Its browser tasks measure reaction delay, digit-recall performance and early taps. Optional voice processing saves only recording duration and amplitude, not audio. Repeated observations establish a personal statistical reference; new observations are compared with your own earlier records. Charts, dated changes, saved processing updates and explanations describe those comparisons. They cannot examine your brain or diagnose a condition.

The uploaded feature-list conversation is the audit reference. Its example values are illustrative, not clinical rules. Its seven-page structure is explicitly recommended: the existing workspace tabs cover those capabilities without duplicate pages.

## Concrete gaps found and repaired

1. **Steps were missing.** Activity minutes are not steps. Added optional integer step counts, API/database validation, editing/history, chart selection/means, personal steps references, dated deviations, source fingerprints, rule guidance and summarized insights. File imports accept the original five columns or optional sixth `steps` column. Blank steps stay missing; zero is an explicit count. Older records are not backfilled with invented counts.
2. **Saved updates waited for Overview/My baseline.** The processing synchronizer now remains mounted across workspace tabs. A refreshed valid dataset triggers owner-scoped server calculation while the signed-in workspace is active. Save failures remain visible/retryable. This is not background device monitoring when the browser is closed.
3. **No explicit arithmetic mean in the chart.** Added the average of the selected displayed records, with units and record count. This differs from the median used for the personal reference and excludes missing optional steps.
4. **Baseline readiness could overstate equal-time evidence.** Cognitive/voice readiness now requires three strictly earlier sessions, agreeing with the actual calculation. Optional steps have separate readiness counts.
5. **Entry buttons were implicit.** Landing now has Start assessment and Sign in actions plus a short non-diagnostic label. The assessment link selects cognitive tasks in an authenticated workspace; signed-out users must sign in first.
6. **Provider and dashboard input windows could differ for sparse optional records.** Explanation processing now loads the same maximum 365 daily and 100 cognitive/voice records before calculating the supplied summary.

This branch includes the prior site-wide readability changes: explicit See more/See less buttons, structured statistical/AI explanations and original-unit baseline differences. It preserves the current layout.

## Four core capabilities

| Capability | Repository status | Evidence / scope |
|---|---|---|
| Multimodal collection | Complete | Dated manual/CSV sleep, activity, optional steps/sleep pattern, stress; real tasks; optional numeric voice; persistence/edit/validation |
| Adaptive personal twin | Complete | Own rolling reference, missing-data readiness, recalculation after refreshed data, source-fingerprinted saved updates and longitudinal history |
| Multimodal trends/deviations | Complete | Per-signal earlier references, actual-unit differences, reproducible flags, current seven-day coverage and dated history |
| Dashboard/insights | Complete | Stored-data charts/means, median comparisons, factors/guidance, optional Groq explanation and fixed experimental reaction forecasts |

Complete means repository behavior verified within this wellness prototype, not a fresh live-cloud acceptance test or clinical validation. Production activation for new steps is **Partial** until migration 005 and deployment.

## Nine-stage pipeline

| Stage | Status | Actual implementation |
|---|---|---|
| Collection | Complete | Authenticated owner-specific saves; optional sources stay optional |
| Preprocessing | Complete | Numeric/range/date/whole-step checks, atomic CSV parsing, nullable fields, ordering |
| Feature selection | Complete | Available eligible signal selection at runtime; separate documented research feature-set comparison |
| Multimodal fusion | Complete | Mean capped absolute personal departures from recent eligible channels, with coverage and units explained |
| Personal baseline | Complete | Up to 30 earlier observations; median and MAD with explicit spread floors |
| Twin updating | Complete | New/edited refreshed data recomputes profile and saves distinct source/version snapshots across tabs |
| Trend/deviation detection | Complete | Defined 2.5-reference-spread threshold; prior-only history; direction and original-unit differences |
| Explainable insights | Complete | Deterministic recorded-data explanations and guidance; optional consented provider receives computed summary |
| Visualization/evaluation | Complete | Actual observations/history, repeatable algorithm tests, real-data offline model evaluation and later personal forecast errors |

The steps spread floor is 500 steps; eight recorded counts establish the first comparison. It is a descriptive implementation setting, not a validated medical threshold. Steps and movement minutes can be correlated; fusion does not claim they are independent clinical evidence. Missing counts are omitted, including from the chart average. Each factor retains its own recorded date.

## Recommended pages mapped to the existing website

| Requested area | Where to find it |
|---|---|
| Landing | `/`, head interaction, four feature cards, start/sign-in, disclaimer |
| Profile/consent | `/account/` plus Privacy & data; account identity and consent preferences, no unnecessary demographic collection |
| Collection centre | Daily check-in, Cognitive tests, Voice signal, Trends & import |
| Digital twin profile | My baseline, latest saved update, source references, historical comparisons, data readiness |
| Analytics | Overview chart selector and means; My baseline actual/reference chart and change timeline |
| Insights/recommendations | Overview Personalized insight and Practical next steps; optional AI block |
| Data management | Privacy & data; permissions, export, wellness deletion, optional permanent account deletion |

## The document's 18 practical checks

| # | Check | Implementation and evidence | Live acceptance action |
|---|---|---|---|
| 1 | Account | Supabase registration/confirmation/sign-in/out/recovery; owner previously reported working; not freshly emailed in this audit | Sign out/in with your test account |
| 2 | Consent | Server checks, DB policies, client controls; local PG and React checks | Decline optional voice/AI and confirm they remain disabled |
| 3 | Sleep | Validated dated persistent input and edit flow; React/PG tests | Save 8 hours, refresh |
| 4 | Steps | Added optional count; 7000 validated, retained by actual React save and PG query | Save 7000, refresh/sign out/in, confirm 7000 remains |
| 5 | Stress | Rating 0–10 preserved; actual save tests | Save 3, confirm 3/10 |
| 6 | Cognitive tests | Real digit-position scoring; full task interaction test; no random result generation | Try known correct/incorrect recall |
| 7 | Reaction time | Browser timing, median of five valid trials, early-tap count; actual handler tests | Check measured ms and saved history |
| 8 | History | Dated rows, timestamps, edits, owner-scoped loaded history/export | Compare dates and values after refresh |
| 9 | Baseline | Prior-only median/MAD tested; eight daily or four cognitive/voice sessions for first comparison | Inspect the displayed usual values |
| 10 | Personalization | Test verifies identical latest sleep gives different comparisons for different prior histories | Use separate test accounts with different real histories |
| 11 | Updating | Actual React test checks new processing POST after save while still on collection tab; server snapshot tests | Save/edit and inspect saved update history |
| 12 | Deviations | Known step/sleep/stress changes trigger documented threshold in deterministic tests | Inspect direction, unit, earlier reference and date |
| 13 | Fusion | Test changes sleep/stress with cognitive inputs unchanged; combined summary changes without changing cognitive factors | Review contributing signals, not a causal claim |
| 14 | AI | Statistical calculation and consented provider/fallback routes tested with mocks | Request once, compare words/numbers with your actual readings; provider text is not guaranteed clinically correct |
| 15 | Dashboard | React refresh/save flow and actual values drive charts/summary | Refresh and inspect saved values |
| 16 | Missing data | Empty optional steps excluded, not zero; voice/AI optional; tests cover absent modalities | Leave steps empty and skip voice |
| 17 | Isolation | Real local PG roles/policies deny another account's private records, including steps | Recheck with a disposable second cloud account |
| 18 | Evaluation | Expected-value algorithm tests, database checks, real-data research artifacts and prospective forecast matching | Open About the research and compare published tables |

No additional stand-alone attention battery is claimed: the reaction task measures response delay and early responses, not a validated general attention score. No overall brain-health percentage or disease predictor is implemented or implied.

## Verification results

- `npm test`: **60 passed** (including optional steps, same-observation/different-history personalization, fusion sensitivity, missing counts, equal-time readiness, provider boundaries and explanation presentation).
- `node tests/prediction-database.check.mjs`: **32 passed** in disposable local PostgreSQL/PGlite. Migrations 001–005, repeatability, step persistence/constraints, ownership, deletion and prior forecast checks. No live Supabase data modified.
- `node tests/workspace-interactions.check.mjs`: **43 passed**, actual React with mocked auth/API. Includes step entry/save/history, update request on the collection tab, disclosure visibility and existing cognitive/voice/privacy workflows.
- TypeScript and production build: passed. No standalone lint configuration exists.
- Local production-server HTTP checks: **10 protected operations + 3 public pages passed**. Synthetic baseline layout inspected at desktop and 390px mobile; no document overflow (375px document width).
- Live email delivery, provider responses, actual microphone hardware and authenticated cloud persistence require owner acceptance; mocks are not those services.

## Free setup and activation

1. In the existing Supabase project open SQL Editor → New query. Paste all of `supabase/migrations/005_optional_daily_steps.sql`, after previously applied 001–004, and run. This only adds an optional column and constraint. Do not rerun 001. Existing rows retain null steps.
2. Open this branch's Vercel Preview with existing environment variables. No new API key, model training purchase or service is required. Readiness, statistics and step comparisons do not call Groq.
3. In a disposable account save steps 7000 on a check-in. Refresh, edit, and confirm retention in history/export. Leave another day's steps blank; it must say Not recorded. Seven recorded prior counts plus the latest count enable its first reference comparison; do not alter genuine historical records just to force a flag.
4. Check saved twin updates, account isolation and disposable wellness deletion. Existing records, including steps, must disappear only for the deleting account.
5. Merge only after Preview checks pass. Wait for the main Production deployment to be Ready, then hard-refresh the production domain. This branch also carries the latest readability improvements if they have not already been merged.

Optional direct wearable OAuth is **Not implemented**; CSV health summaries are supported. Automatic individual model retraining and clinical validation are **Not implemented**, not requirements claimed complete. The fixed reaction model remains an experimental transfer model and has not consistently beaten the recent-average baseline. Seven separate new routes, paid integrations and disease predictions are not needed to satisfy this feature list.
