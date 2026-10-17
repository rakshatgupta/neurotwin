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

This migration and form update do not enable predictions. Remaining implementation: build features with the training formula; create account-private immutable forecast records; match future compatible assessments within 48h; include forecasts in export/deletion; display baseline comparisons and experiment limits; verify timing, matching and ownership. No additional paid inference service is needed.
