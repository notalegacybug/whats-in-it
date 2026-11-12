# Ingredient Safety: where we stopped (2026-11-12)

## To resume

Open a session in this folder and say:

> Resume the ingredient safety build. Read NEXT-STEPS.md, then run plan 1 subagent-driven.

## State

- **Design:** approved. `docs/superpowers/specs/2026-11-12-ingredient-safety-design.md`
- **Plan 1 of 3 (core app on the device):** written, not started. `docs/superpowers/plans/2026-11-12-core-app.md`
- **Code:** none. No project scaffold, no installs, no git repository yet (task 1 of the plan creates it).
- **Plans 2 and 3:** not written. Plan 2 = shared library server, barcode shortcut, "report a problem". Plan 3 = web hosting, Android wrapper, Google Play closed test.

## Decided

- Build method: subagent-driven (a fresh agent per task, a fresh reviewer per task).
- Verdicts come from a fixed reference built from IARC, NTP, California Prop 65 and EU carcinogen classifications. No AI at scan time.
- Version 1 inputs: photo, screenshot, typed or pasted text. Barcode arrives with plan 2. Product links are version 2.
- Web app plus Android first. English labels only. Zero running cost. No accounts, no personal data.
- Bad records: "report a problem" button, owner fixes by hand. Reference refreshed every 6 months.
- Google Play account is personal, created after November 2023, so a closed test (about 12 testers, 14 days) is required before public release.

## Still open (answer before or at resume)

The plan narrows the design in three places, listed at the top of the plan. Not yet confirmed:

1. Hand-checked notes only for listed ingredients that can appear on a label, not every listed substance.
2. Ordinary ingredients show one function word (for example "preservative"); fuller notes come later.
3. Saved products store the ingredient list only; verdicts are recalculated on display.

## Where the build will stop and need the owner

- Task 5 or 6: if an official list forbids redistributing its data, or a download site blocks the agent.
- After task 7: spot-check 50 sample ingredient notes (~15 min).
- After task 13: scan five real products on a phone and report mistakes (~20 min).

## Estimate

About 3 to 5 hours of agent run time for the 13 tasks, unmeasured.
