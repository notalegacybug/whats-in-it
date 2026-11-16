# Ingredient Safety

A web app (installable PWA) that reads an ingredient label on the device, from a photo, a screenshot or typed text,
and says which ingredients appear on published cancer hazard lists, citing the list, classification and year or edition.
Verdicts come only from a bundled `public/reference.json`. There is no AI and no server at scan time, and images never leave the device.

Not medical advice: a listing describes a hazard, not the risk from a product.

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server with hot reload. |
| `npm test` | Unit and component tests (Vitest), once. |
| `npm run e2e` | End-to-end tests (Playwright, Chromium). Builds the app and serves it on port 4173 first. |
| `npm run build` | Type-check (`tsc -b`) and production build into `dist/`. |
| `npm run preview` | Serve the production build locally (the service worker only runs in this mode). |
| `npm run reference:build` | Rebuild `public/reference.json` from the files in `data/`. Prints a per-source summary and what changed. |
| `npm run reference:build -- --allow-missing-sources` | Same, but skip hazard or inventory files that are missing (with a warning) instead of stopping. Needed today: four source files are missing. |
| `npm run reference:build -- --allow-missing-notes` | Same, but do not fail when listed entries lack a hand-checked note. |
| `npm run reference:sample` | Write `docs/reference-review-sample.md` from `public/reference.json` for a person to spot-check notes. |

Node 22.12 or newer is required (see `engines` in `package.json`).

The reference build refuses to write anything when:

- a hazard file is missing and not excluded (unless `--allow-missing-sources`);
- a file lacks a header its adapter reads, or yields 0 records;
- two entries claim the same name, alias or CAS number;
- `data/notes/notes.json` breaks the note rules (below);
- the content changed but `data/version.json` still has the previous build's version.

## Adding a missing source file

1. Follow the instructions for that file in [`data/sources/README.md`](data/sources/README.md): where to download it, which
   header row it needs, and what to record (download date, edition, row count, reuse terms).
2. Check `data/sources/config.json`:
   - `exclude`: remove the source's id if it is listed (IARC stays excluded until the reuse-terms decision is made).
   - `editions`: add the edition text for the source (for example `"PROP65": "..."`). It is shown in citations when a listing
     has no year. Write only what the file or its page states.
   - `euClpAnnexYear`: set to the year of the Annex VI edition when adding `eu-clp.csv`; the build refuses that file while it is `null`.
3. Bump `data/version.json` (for example `2026.11.2` to `2026.11.3`). Saved products record the version they were checked against,
   so the build fails if the content changes under the same version.
4. Run `npm run reference:build` (add `--allow-missing-sources` while other files are still missing). Read the summary: the
   source should say `included (N records)`, and the listed-entries count per source should look plausible.
5. Run `npm run reference:sample` and read `docs/reference-review-sample.md` for entries that look wrong.
6. Run `npm test` and `npm run e2e`, then commit the CSV, `config.json`, `version.json`, `public/reference.json` and the sample.

## Notes workflow

Listed entries that a person could meet on a label get a short hand-checked note in `data/notes/notes.json`, keyed by entry id
(for example `"cas:50-00-0"`), with an optional `caveat` for form- or route-specific listings.

- After each build, `data/notes/missing.json` lists the ids of listed entries that also appear in an ingredient inventory and have
  no note. The build exits with an error while that list is non-empty, unless `--allow-missing-notes` is passed.
- `checkNotes` (`scripts/reference/notesCheck.ts`) stops the build if a note is empty, a note or caveat is over 30 words, a key is
  not a real entry id, or the text contains a banned term. Banned terms are health claims (`safe`, `toxic`, `carcinogen` and
  similar) and reassuring words (`natural`, `small amounts`, `harmless`, `approved` and similar). Notes say what the substance
  is and where it comes from, nothing more.
- After changing notes, bump the version, rebuild, and run `npm run reference:sample` so the sample shows the new text.

## Current data state (reference 2026.11.8)

| Source | Kind | State |
| --- | --- | --- |
| NTP Report on Carcinogens, 15th edition (2021) | hazard list | included (302 listed entries) |
| IARC Monographs | hazard list | file obtained, **excluded** pending the owner's reuse-terms decision |
| California Prop 65 | cancer list; reproductive harm (optional check) | included (771 listed entries); owner downloads the file, then `npx tsx scripts/prepare-prop65.ts` |
| EU CLP Annex VI | hazard list | **missing**, download blocked for the agent |
| FDA Substances Added to Food | ingredient inventory | included |
| EU CosIng | ingredient inventory | included (33,658 ingredients, collected by `node scripts/fetch-cosing.mjs`) |
| EU E numbers | ingredient inventory | **missing** |
| EU Endocrine Disruptor Lists (edlists.org) | hormone-disruptor lists, optional check | included (111 listed entries), collected by `node scripts/fetch-edlists.mjs` |
| US FDA GSRS (UNII names) | everyday names (e.g. Coconut Oil) | included, collected by `node scripts/fetch-gsrs.mjs` |

The app states this to users: the About screen lists the included lists under "Checked against" and the rest under
"Not yet included", and each result says which lists it was checked against.
