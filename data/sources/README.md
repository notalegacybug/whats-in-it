# Hazard list sources

Four official cancer-hazard lists feed the reference build. Each is stored here as a UTF-8 CSV and read by
an adapter in `scripts/reference/adapters/`. Downloaded originals live in `original/` (git-ignored).

| File | Status | Rows |
| --- | --- | --- |
| `iarc.csv` | obtained, **held back from git** (see reuse terms) | 1128 |
| `ntp.csv` | obtained | 349 |
| `prop65.csv` | **MISSING**, download blocked | - |
| `eu-clp.csv` | **MISSING**, download blocked | - |

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
- **Reuse terms:** not checked (site blocked). Check ECHA's legal notice before committing the file.
