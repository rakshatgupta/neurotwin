# Readability follow-up — 18 October 2026

Confirmed the previous readability commit is merged into main (merge 6238c0d). The public live home bundle includes its earlier native disclosures (`when-closed`), but not the new explicit `disclosure-button` revision. Existing disclosure affordances were too subtle. This revision replaces them with visibly bordered buttons, independent of native details styling, with aria-expanded, aria-controls, and actual hidden content.

Scope: all explanation disclosures across the workspace; remaining long research/prediction/update-history technical disclosures; landing approach; check-in sleep context; privacy storage explanation; cognitive context and sleepiness scale. Short instructions, errors, privacy permissions, deletion consequences and safety limitations remain visible. Pages with only short explanatory copy (account forms and landing feature cards) retain it rather than hiding essential navigation or input guidance.

Overview Personalized Insight now separates: (1) three labelled latest-record facts plus flagged-signal names, (2) optional Groq generation and visible informed consent, and (3) the last saved AI explanation. Full statistical and AI text starts collapsed. Expanded prose is split into numbered reading blocks; existing **bold** emphasis is rendered safely as strong text. No raw HTML is injected, no provider words or numerical values are replaced, and stored insight content is unchanged.

Validation: 55 automated tests passed; 40 actual React interaction checks with mocked auth/API passed, including explicit button state and content visibility; TypeScript passed; production build passed. Local synthetic overview inspected at desktop and 390px mobile; document width 375px in a 390px viewport. No live private-account modifications. No new database migration or environment variable is required.

Deploy by reviewing the codex/readability-everywhere branch Preview and merging it into main. Hard-refresh the production site after Vercel marks the new main deployment Ready. A prior tab or deployment URL may continue to show the previous controls until refreshed/opened on the production domain.
