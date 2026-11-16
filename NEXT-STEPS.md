# Ingredient Safety: where we are (2026-11-12)

## State

- **Design:** approved. `docs/superpowers/specs/2026-11-12-ingredient-safety-design.md`
- **Plan 1 of 3 (core app on the device):** built on branch `feat/core-app`, all 13 tasks plus the final-review fix wave.
  **Not merged** into `main`. Plan: `docs/superpowers/plans/2026-11-12-core-app.md`
- **Reference data:** version 2026.11.2, built from NTP only (plus the FDA ingredient inventory). See "Current data state"
  in `README.md`. The app says which lists were checked on the About and Result screens.
- **Plans 2 and 3:** not written. Plan 2 = shared library server, barcode shortcut, "report a problem". Plan 3 = web hosting,
  Android wrapper, Google Play closed test.

## What the owner needs to do

1. **IARC decision.** IARC's terms need written permission to reproduce substantial portions of its list. Decide whether to
   ask IARC for permission or keep the app non-commercial and limited. Until then IARC stays excluded in
   `data/sources/config.json` and `iarc.csv` stays git-ignored. Details: `data/sources/README.md`, "iarc.csv".
2. **Two downloads** still missing: `eu-clp.csv`, `e-numbers.csv`. (`prop65.csv` was added on 2026-11-16 from the
   owner's download; refresh it the same way.) (`cosing.csv` was collected on 2026-11-13 with `scripts/fetch-cosing.mjs`.) Steps for each are in `data/sources/README.md`; the general procedure
   (config, version bump, rebuild, sample) is in `README.md`, "Adding a missing source file".
3. **Notes spot-check** (~15 min): read `docs/reference-review-sample.md` and report any note that is wrong, not neutral,
   or has a wrong caveat.
4. **Five-product phone test** (~20 min): scan five real products on a phone (`npm run build` then `npm run preview -- --host`,
   or https://whats-in-it.pages.dev) and report mistakes in reading, splitting or verdicts.
5. **Display rule for form-specific listings.** Some listings cover only one form or route (for example respirable silica
   dust, or a substance listed only as part of a mixture). Today the result shows the listing with its qualifier and a caveat
   where one was written. Decide whether such listings should keep the same "Watch for" heading or be shown differently.

6. **Review 43 drafted notes** (~10 min) for Prop 65 cancer listings: `docs/notes-review-prop65.md`. Edit any in
   `data/notes/notes.json`, bump the version, rebuild.
7. **Reuse terms** for the EU Endocrine Disruptor Lists and Prop 65: confirm before a wide public release.

## After that

- Merge `feat/core-app` into `main` once the owner checks above are done.
- Write plan 2, then plan 3.

## Decided

- Build method: subagent-driven (a fresh agent per task, a fresh reviewer per task).
- Verdicts come from a fixed reference built from IARC, NTP, California Prop 65 and EU carcinogen classifications. No AI at scan time.
- Version 1 inputs: photo, screenshot, typed or pasted text. Barcode arrives with plan 2. Product links are version 2.
- Web app plus Android first. English labels only. Zero running cost. No accounts, no personal data.
- Bad records: "report a problem" button, owner fixes by hand. Reference refreshed every 6 months.
- Google Play account is personal, created after November 2023, so a closed test (about 12 testers, 14 days) is required before public release.
