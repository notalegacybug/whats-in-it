# Ingredient Safety: where we are (2026-11-16)

## Resume here

**Next task: Play Console closed test (step 3 of the Play Store route).** Done on the owner's personal computer
(no installs on the work machine).
1. Play Console: create the app, upload `whats-in-it.aab` to **Closed testing**, fill the listing from
   `docs/play-store-listing.md`.
2. Play Console > App integrity: copy the **App signing key** SHA-256 and add it as a second entry in
   `sha256_cert_fingerprints` in `public/.well-known/assetlinks.json`, push to `main`. (Google re-signs the app,
   so without this the Play-installed app shows a browser bar.)
3. Invite 12 testers, run 14 days, then apply for production.

Done 2026-11-16: PWABuilder package built (package id `dev.pages.whats_in_it.twa`, upload-key fingerprint in
`assetlinks.json`), file live at https://whats-in-it.pages.dev/.well-known/assetlinks.json. The signing key
(`signing.keystore` + `signing-key-info.txt`) is kept privately by the owner, never in git (`.gitignore` blocks it);
losing it means the app cannot be updated.

Ready already: privacy policy (https://whats-in-it.pages.dev/privacy), Play-ready manifest, listing draft.

## State

- **Live app:** https://whats-in-it.pages.dev, deployed by Cloudflare Pages from **`main`** (switched 2026-11-16).
  `main` and `feat/core-app` are identical; push to `main` to deploy.
- **Reference data 2026.11.10:** cancer = NTP + Prop 65 (939 listed); optional "hormone & reproductive" check =
  EU Endocrine Disruptor Lists + Prop 65 reproductive; allergens = EU fragrance allergens (CosIng) + 14 EU food
  allergens + the label's "may contain" line; names = CosIng, FDA food list, FDA GSRS everyday names,
  hand-checked aliases. Details and refresh steps: `README.md` and `data/sources/README.md`.
- **App features:** photo/paste/description reading, OCR noise cleanup, suggestions, your-own-research notes,
  edit ingredients, delete scans, light/dark theme, per-check answers ("none found"), compact source line.
- **Tests:** 385 unit + 3 end-to-end, all passing.

## What the owner needs to decide or do

1. **App name** before Play: "Safety" can read as a promise. Alternatives in `docs/play-store-listing.md`.
2. **Contact email** for the Play listing (shown publicly).
3. **Reuse terms** for Prop 65 (OEHHA) and the EU Endocrine Disruptor Lists: confirm before a wide public release.
4. **IARC decision** (still excluded): ask IARC for permission, or keep it out.
5. **Review notes** (~25 min): `docs/notes-review-prop65.md` (43) and `docs/reference-review-sample.md`.
6. **Phone test:** scan five real products and report mistakes.
7. **Still missing sources:** `eu-clp.csv`, `e-numbers.csv` (steps in `data/sources/README.md`).

## Refreshing data (every 6 months)

- CosIng: `node scripts/fetch-cosing.mjs`; fragrance allergens: `node scripts/fetch-fragrance-allergens.mjs`;
  FDA names: `node scripts/fetch-gsrs.mjs`; EU ED lists: `node scripts/fetch-edlists.mjs`.
- Prop 65: owner downloads the list to `data/sources/original/p65chemicalslist.csv`, then
  `npx tsx scripts/prepare-prop65.ts`.
- Then bump `data/version.json`, `npm run reference:build -- --allow-missing-sources`, `npm run reference:sample`, push.

## Decided

- Verdicts come only from published lists; the app never says "safe". No AI at scan time.
- Allergens and the hormone & reproductive check are information or opt-in; cancer is the default check.
- Web app plus Android (Trusted Web Activity via PWABuilder). Zero running cost. No accounts, no personal data.
- No "Co-Authored-By" lines in commits.
- Google Play account is personal, created after November 2023: closed test of 12 testers for 14 days first.
- Later: plan 2 (shared library server, barcode, "report a problem"); version 2 (product links, AI reading).
