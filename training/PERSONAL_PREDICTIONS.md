# Personal prediction implementation notes

## Source verification, 17 October 2026

Gardasevic et al., Brighter Time: A Smartphone App Recording Cognitive Task Performance and Illuminance in Everyday Life, Clocks & Sleep 4 (2022), 577–594.
https://doi.org/10.3390/clockssleep4040045
https://pmc.ncbi.nlm.nih.gov/articles/PMC9589962/

The study explicitly used a modified ten-point Karolinska Sleepiness Scale: 1 extremely alert, 10 extremely sleepy. Observed 10 values are valid coding, not automatically errors. Time awake is elapsed time between waking and the test, expressed in hours. Preserve these variables separately from stress and sleep duration.

The current five-trial browser task is a different protocol. Do not call its predictions validated Brighter Time PVT forecasts. The first experimental integration may be labelled as a transfer experiment; validation against future browser results is still required.

## Database preparation

Apply supabase/migrations/002_assessment_prediction_context.sql after 001. It is additive and repeatable. Old rows retain null context and are not eligible for contextual forecasts. The protocol default identifies the existing five-trial task rather than falsely labelling it a research PVT. utc_offset_minutes represents local minus UTC (India: 330); store the browser's negative getTimezoneOffset().

Assessment context collection is now implemented in the form and authenticated API. The GET response and history include it; export already selects all assessment columns. Null legacy context is preserved. The server validates ranges, complete context, timestamps within the last hour (five minutes future clock tolerance), and the explicit five-trial protocol. The form captures timezone at test start, not save time. The browser timestamp is reported metadata, not trusted proof of task execution.

## Prediction workflow

Apply migration 003_personal_predictions.sql before deploying the prediction code. The signed-in Personal predictions tab requires three context-bearing five-trial sessions and a recent source session. It computes a fixed trained-model estimate and recent-three-result baseline using the database RPC. Inputs and coefficients are not accepted from the client. Input snapshots, history IDs, versions and timing are retained with the forecast. The local clock feature uses the assessment-start timestamp and captured offset.

Expiry is 48 hours from the source assessment start, matching the research target's maximum gap. Repeated creation for the same source/model restores the same forecast. The next compatible saved assessment matches only if it started after forecast creation and is saved before expiry. Already-started or untimed sessions invalidate the pending forecast. Late saves expire it. Assessment insert triggers match forecasts atomically, sharing a per-account advisory lock with creation. Original estimates cannot be updated by authenticated clients. Owners may delete their own records; this is not an external tamper-proof audit system. Browser-reported metadata and measurements are not trusted evidence of task execution.

GET/POST /api/predictions authenticate the session. Creation requires storage consent and an explicit UI acknowledgement. Predictions do not require Groq or external provider transmission. Export includes predictions; delete_my_data removes them atomically; auth account deletion cascades. Pending status is displayed as expired once its time passes, without requiring a scheduled worker.

The comparison remains an unvalidated transfer experiment for the five-trial task. It is personal inference, not automatic personal retraining. Groq integration with these forecasts is not included. Future work: prospective real-user evaluation and any separately evaluated calibration.

## Verification

38 automated application tests passed, including authenticated prediction endpoint ownership, consent gates, client-input rejection and safe errors. 17 disposable local PostgreSQL checks passed using PGlite with a simulated Supabase auth schema: migrations 001–003, repeatable migration, database-vs-exported coefficient parity, RLS isolation, write denial, duplicate forecast restoration, matching, invalidation, expiry and deletion. These do not constitute live Supabase verification or a concurrency stress test.

Run local database checks with `node tests/prediction-database.check.mjs` after installing the QA-only PGlite package into the ignored `.taste-skill/prediction-check` prefix. No production dependency was added.
