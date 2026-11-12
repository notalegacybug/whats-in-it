# Reference sources

Four official cancer-hazard lists and three ordinary-ingredient inventories feed the reference build
(`npm run reference:build`). Each is stored here as a UTF-8 CSV and read by
an adapter in `scripts/reference/adapters/`. Downloaded originals live in `original/` (git-ignored).

| File | Status | Rows |
| --- | --- | --- |
| `iarc.csv` | obtained, **held back from git** (see reuse terms) | 1128 |
| `ntp.csv` | obtained | 349 |
| `prop65.csv` | **MISSING**, download blocked | - |
| `eu-clp.csv` | **MISSING**, download blocked | - |
| `fda-saf.csv` | obtained (ingredient inventory) | 3970 |
| `cosing.csv` | **MISSING**, no downloadable file found (ingredient inventory) | - |
| `e-numbers.csv` | **MISSING**, not built (ingredient inventory) | - |

## Build settings: `config.json`

```json
{ "exclude": ["IARC"], "euClpAnnexYear": null }
```

- `exclude`: hazard sources the build must not read even if their file exists. **IARC is excluded by default**
  because its reuse terms (see `iarc.csv` below) are awaiting the owner's decision; the committed
  `public/reference.json` therefore contains no IARC data. Remove `"IARC"` from the list only after that
  is settled (and the `iarc.csv` line in `.gitignore` is dealt with).
- `euClpAnnexYear`: the year of the Annex VI edition in `eu-clp.csv`. Must be a number once that file is
  present; the build refuses to run if it is `null`.

A file that is missing and not excluded stops the build, unless `--allow-missing-sources` is passed
(it is then skipped with a warning). Every file that is read is checked: the build fails if a header the
adapter reads is absent, or the adapter finds 0 records. No flag overrides that check.
The adapters for the two missing files are written and tested against small fixtures that follow the
documented column layout (marked "FIXTURE, NOT COPIED FROM THE REAL FILE" in the tests). Nothing was
reconstructed from memory. When the real files arrive, compare their headers with each adapter's
`COLUMNS` constant and change the constant and the fixture, nothing else.

## iarc.csv

- **Source:** IARC Monographs, "List of classifications" - https://monographs.iarc.who.int/list-of-classifications
- **Downloaded:** 2026-11-12
- **Edition:** Volumes 1-142, page stamped "Last updated: 2026-07-23 14:08 (CET)"
- **How it was obtained:** the page's own CSV button builds the file in the browser from data embedded in
  its script (`https://webapi.iarc.who.int/loc/loc.app.js`, kept in `original/iarc-loc.app.js`). The data
  was extracted from that script as data (not executed) and written with the same seven columns the
  page's table shows. HTML tags in names were stripped, as the page's export does; several CAS numbers
  are joined with `; `.
- **Header row:** `CAS No.,Agent,Group,Volume,Volume publication year,Evaluation year,Additional information`
- **Reuse terms** (https://www.iarc.who.int/copyright-notice/ and https://publications.iarc.who.int/Terms-Of-Use/):
  extracts may be reproduced for research, private study, educational or non-commercial purposes with
  limited circulation, with IARC acknowledged as the source and the URL cited. Reproduction of substantial
  portions, wider circulation, or any other use requires written permission from IARC. A full copy of the
  list in a published app is arguably a substantial portion, so **the owner needs to decide** whether to
  seek permission or keep the app non-commercial and limited. Until then `iarc.csv` is git-ignored
  (see `.gitignore` in this folder).

## ntp.csv

- **Source:** NTP Report on Carcinogens, 15th edition (released 2021-12-21), "15th RoC CASRN Index in MS Excel"
  linked from https://ntp.niehs.nih.gov/go/roc (resolves to https://ntp.niehs.nih.gov/research/assessments/cancer/roc),
  file https://ntp.niehs.nih.gov/sites/default/files/ntp/roc/content/roc15_casrn_index.xlsx
  (kept in `original/roc15_casrn_index.xlsx`). The 15th is the latest edition per the page.
- **Downloaded:** 2026-11-12
- **Conversion:** spreadsheet read with a one-off Python (standard library only) script, not a project dependency.
  Source columns `CASRN | NAME OR SYNONYM | Listing in the 15th RoC` became `Name,CAS,Listing,Year`:
  `Known` became `Known to be a human carcinogen`, `RAHC` became `Reasonably anticipated to be a human
  carcinogen` (the spreadsheet's own legend), `NA` in CASRN became an empty CAS. Names are as the source
  gives them, including trailing `(see ...)` cross-references (the adapter removes those).
- **Year is empty for every row.** The spreadsheet gives no per-substance listing year, and the edition year
  (2021) is not a listing year, so none was invented.
- **Header row:** `Name,CAS,Listing,Year`
- **Coverage:** rows are index entries (one per CAS number or synonym), so a listing such as "Estrogens,
  Steroidal" appears under each member's CAS. 47 rows have no CAS number in the source.
- **Reuse terms** (https://ntp.niehs.nih.gov/support/policies): unless a copyright is indicated, NTP website
  information is public domain and may be copied and distributed without permission; citing NTP is appreciated.

## prop65.csv - MISSING

- **Source:** OEHHA Proposition 65 list - https://oehha.ca.gov/proposition-65/proposition-65-list
- **What happened:** the site answers automated requests with a bot-detection challenge page (Incapsula), not
  the page. It was not worked around. The California open-data portal had no copy.
- **What a person needs to do:** open the page in a browser, download the list's spreadsheet, open it, save
  as CSV (UTF-8) to `data/sources/prop65.csv`. The header row must contain `Chemical`, `Type of Toxicity`,
  `CAS No.`, `Date Listed` (the adapter reads only these; if the real headers differ, edit `COLUMNS` in
  `scripts/reference/adapters/prop65.ts` and the test fixture). Record here the download date, the "last
  updated" date and row count.

**Assumed cell formats, unverified** (the adapter was written without seeing the real file; if the real wording differs it could silently drop every cancer row):
- `Type of Toxicity` contains the word `cancer`, possibly alongside other toxicities, comma-separated (e.g. `cancer, developmental, male`).
- `Date Listed` contains a four-digit year somewhere in the cell.
- In `Chemical`, a trailing parenthetical in the name becomes the qualifier only if it contains one of: airborne, inhalation, inhalable, respirable, oral, dermal, particles, fibres, fibers, dust, unbound, aerosol, mist, vapour, vapor (`ROUTE_WORDS` in `scripts/reference/util.ts`). Any other bracket stays in the name, so `Chromium (hexavalent compounds)` is not shortened to `Chromium`.
- The build refuses a source that yields 0 records or lacks its expected headers.

- **Reuse terms:** not checked (site blocked). Check OEHHA's conditions of use before committing the file.

## eu-clp.csv - MISSING

- **Source:** ECHA, Annex VI to CLP, harmonised classification table - https://echa.europa.eu/information-on-chemicals/annex-vi-to-clp
- **What happened:** ECHA answers automated requests with HTTP 403 and a script challenge (Azure WAF), for
  the page, its legal notice, and a guessed spreadsheet URL. It was not worked around.
- **What a person needs to do:** open the page in a browser, download the Annex VI table spreadsheet (the
  newest ATP edition), delete any title rows above the header, save as CSV (UTF-8) to
  `data/sources/eu-clp.csv`. The header row must contain `International Chemical Identification`, `CAS No`,
  `Hazard Class and Category Code(s)`. Record here the download date, ATP edition and its year (the build
  passes that year to `parseEuClp` as `annexYear`) and row count.

**Assumed cell formats, unverified** (same risk: wrong wording could silently drop every Carc. row):
- `Hazard Class and Category Code(s)` separates several codes by a newline or `;`, and a carcinogenicity code reads `Carc. 1A`, `Carc. 1B` or `Carc. 2`.
- A route may follow the code in brackets, e.g. `Carc. 2 (inhalation)`; it goes to the qualifier and the classification is stored as `Carc. 2`.
- In `International Chemical Identification`, a trailing parenthetical in the name becomes the qualifier only if it contains one of: airborne, inhalation, inhalable, respirable, oral, dermal, particles, fibres, fibers, dust, unbound, aerosol, mist, vapour, vapor (`ROUTE_WORDS` in `scripts/reference/util.ts`). Any other bracket stays in the name, so `Chromium (hexavalent compounds)` is not shortened to `Chromium`.
- The build refuses a source that yields 0 records or lacks its expected headers.

- **Reuse terms:** not checked (site blocked). Check ECHA's legal notice before committing the file.

## fda-saf.csv

- **Source:** FDA, Substances Added to Food (formerly EAFUS) -
  https://www.fda.gov/food/food-additives-petitions/substances-added-food-formerly-eafus ; the page's own
  "Download" link (`.../scripts/fdcc/cfc/XMLService.cfm?method=downloadxls&set=FoodSubstances`, served as
  `FoodSubstances.csv`; kept unchanged in `original/fda-saf-FoodSubstances.csv`).
- **Downloaded:** 2026-11-12. The file's own title line says "Last updated 9/8/2026".
- **Conversion:** the file is Windows-1252 text; it was re-saved as UTF-8 and the four title/disclaimer
  lines above the header row were removed. Nothing else was changed.
- **Header row:** `CAS Reg No (or other ID),Substance,Other Names,Used for (Technical Effect),Reg col01,...,JECFA Flavor Number`
  (37 columns; the adapter reads `CAS Reg No (or other ID)`, `Substance`, `Used for (Technical Effect)`).
- **Rows:** 3970. Cells carry a leading space, technical effects are separated by `,<br />` and written in
  capitals; the adapter trims and lower-cases them. The first column also holds non-CAS IDs; only valid
  CAS numbers (check digit verified) are used. `Other Names` is not read.
- **Reuse terms** (https://www.fda.gov/about-fda/about-website/website-policies): unless otherwise noted
  the contents of the FDA website are not copyrighted, are in the public domain, and may be republished
  freely without permission; credit to FDA is appreciated. Caveat: the file says it includes information
  from non-FDA entities (FEMA, JECFA) and that this "does not indicate an FDA approval or evaluation"; only
  substance names, CAS numbers and technical effects are used here.

## cosing.csv - MISSING

- **Source:** EU CosIng, cosmetic ingredients inventory - https://ec.europa.eu/growth/tools-databases/cosing/
  (also described at https://single-market-economy.ec.europa.eu/sectors/cosmetics/cosmetic-ingredient-database_en).
- **What happened:** the CosIng site is a search application that loads its data from a back end; the pages
  fetched (the app, its scripts, the cosmetics database page, the ingredient glossary page) link to no
  downloadable inventory file, and the EU open-data portal search found no CosIng dataset. The back end was
  not scraped. Nothing was reconstructed from memory.
- **What a person needs to do:** find the inventory download for CosIng (the site has offered the
  "Ingredients and Fragrance inventory" as a CSV; check the CosIng "Ingredients" search page for an export or
  download button), save it as UTF-8 CSV to `data/sources/cosing.csv`, delete any title rows above the
  header, and record here the download date, edition, row count and the site's reuse terms (the Commission's
  legal notice, https://commission.europa.eu/legal-notice_en, is not yet checked).

**Assumed columns and cell formats, unverified** (the adapter, `scripts/reference/adapters/cosing.ts`, was written without seeing the real file):
- Headers `INCI name`, `CAS No`, `Function`, `Restriction`. If the real names differ, change `COLUMNS` in the adapter and the synthetic fixture in its test.
- `CAS No` holds one or more CAS numbers separated by `/`, `;`, `,` or spaces.
- `Function` holds comma-separated functions in capitals (kept as lower-case text).
- `Restriction` starts with `II/` for substances banned in cosmetics (Annex II); any other text, or blank, is "not banned".
- One substance may appear in several rows under different INCI names (for example `TITANIUM DIOXIDE` and `CI 77891`); rows sharing a CAS number merge, and the other names become aliases.

## e-numbers.csv - MISSING

- **Source intended:** an official EU list of approved food additives and their E numbers (Regulation (EC)
  No 1333/2008, Union list). Columns `E,Name`.
- **What happened:** EUR-Lex returned only the 2008 original text of the regulation, which predates the
  Union list, and a dated consolidated version was not found at a guessable address. A stale list would
  give wrong aliases (E numbers are added and withdrawn), and the file must not be written from memory,
  so it was not built.
- **What a person needs to do:** take the current consolidated Union list of food additives from EUR-Lex or
  the Commission's food additives database, write `E,Name` rows (for example `E 171,Titanium dioxide`) to
  `data/sources/e-numbers.csv`, and record here the source URL, edition date, row count and reuse terms.
- The adapter (`scripts/reference/adapters/eNumbers.ts`) turns each row into a catalogue record whose alias is
  the normalised number (`e171`); it has no CAS number, so it merges into an entry only when its name matches
  that entry's name or alias exactly.
