# Reference sources

Four official cancer-hazard lists and three ordinary-ingredient inventories feed the reference build
(`npm run reference:build`). Each is stored here as a UTF-8 CSV and read by
an adapter in `scripts/reference/adapters/`. Downloaded originals live in `original/` (git-ignored).

| File | Status | Rows |
| --- | --- | --- |
| `iarc.csv` | obtained, **held back from git** (see reuse terms) | 1128 |
| `ntp.csv` | obtained | 349 |
| `prop65.csv` | obtained (downloaded by the owner; cancer and reproductive rows) | 984 rows |
| `eu-clp.csv` | **MISSING**, download blocked | - |
| `fda-saf.csv` | obtained (ingredient inventory) | 3970 |
| `cosing.csv` | obtained via the CosIng search API (ingredient inventory) | 33658 |
| `e-numbers.csv` | **MISSING**, not built (ingredient inventory) | - |
| `edlists.csv` | obtained (hormone-disruptor lists I, II, III; optional check) | 400 rows |
| `eu-fragrance-allergens.csv` | obtained via the CosIng search API (allergen tags) | 65 entries |
| `gsrs-names.csv` | obtained (everyday names only, ranked below official names) | 16467 substances |

## Build settings: `config.json`

```json
{ "exclude": ["IARC"], "euClpAnnexYear": null, "editions": { "NTP": "15th Report on Carcinogens (2021)" } }
```

- `exclude`: hazard sources the build must not read even if their file exists. **IARC is excluded by default**
  because its reuse terms (see `iarc.csv` below) are awaiting the owner's decision; the committed
  `public/reference.json` therefore contains no IARC data. Remove `"IARC"` from the list only after that
  is settled (and the `iarc.csv` line in `.gitignore` is dealt with).
- `euClpAnnexYear`: the year of the Annex VI edition in `eu-clp.csv`. Must be a number once that file is
  present; the build refuses to run if it is `null`.
- `editions`: optional edition text per hazard list (`IARC`, `NTP`, `PROP65`, `EU_CLP`). It is stored on every
  listing from that list and shown in the citation when the listing has no year of its own. Write only what
  the downloaded file or its page states; leave the year out if you cannot read it there.

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
  (kept as `original/roc15_casrn.xlsx`). The 15th is the latest edition per the page.
- **Downloaded:** 2026-11-12
- **Conversion:** spreadsheet read with a one-off Python (standard library only) script, not a project dependency.
  Source columns `CASRN | NAME OR SYNONYM | Listing in the 15th RoC` became `Name,CAS,Listing,Year`:
  `Known` became `Known to be a human carcinogen`, `RAHC` became `Reasonably anticipated to be a human
  carcinogen` (the spreadsheet's own legend), `NA` in CASRN became an empty CAS. Names are as the source
  gives them, including trailing `(see ...)` cross-references (the adapter removes those).
- **Year is empty for every row.** The spreadsheet gives no per-substance listing year, and the edition year
  (2021) is not a listing year, so none was invented.
- **Edition** (`editions.NTP` in `config.json`): `15th Report on Carcinogens (2021)`. Confirmed from the
  downloaded file itself: its document title (Excel file properties) reads "Download the CASRN index in MS
  Excel; 15th RoC 2021". Citations show this text because the listings have no year.
- **Header row:** `Name,CAS,Listing,Year`
- **Coverage:** rows are index entries (one per CAS number or synonym), so a listing such as "Estrogens,
  Steroidal" appears under each member's CAS. 47 rows have no CAS number in the source.
- **Reuse terms** (https://ntp.niehs.nih.gov/support/policies): unless a copyright is indicated, NTP website
  information is public domain and may be copied and distributed without permission; citing NTP is appreciated.

## prop65.csv

- **Source:** OEHHA Proposition 65 list, https://oehha.ca.gov/proposition-65/proposition-65-list. The site
  blocks automated downloads, so the owner downloads it in a browser and saves it as
  `original/p65chemicalslist.csv`. Current copy: list dated 31 July 2026, downloaded 2026-11-16.
- **Preparation:** `npx tsx scripts/prepare-prop65.ts` writes `prop65.csv` (logic in
  `scripts/reference/prop65Prepare.ts`, tested). It finds the header row below the title rows, drops
  footnotes and dose notes ("Adult", "Infant boys ..."), **drops chemicals marked "Delisted <date>"** (shown as
  strikeout on the website; 25 rows), gives indented group members ("Lead" under "Lead and lead compounds") the
  group's listing, removes note brackets ("[Basis for listing changed ...]") but keeps chemical brackets
  ("Dibenzo[a,h]pyrene"), and reads two-digit years (87-99 = 19xx, 00-86 = 20xx; the list began in 1987).
- **Columns used:** `Chemical`, `Type of Toxicity`, `CAS No.`, `Date Listed`.
- **Use:** rows with `cancer` give a cancer listing (always checked). Rows with `developmental`, `female` or
  `male` give one reproductive listing per chemical (endpoints merged, latest year), shown only when the person
  turns on "Check hormone & reproductive effects". All Prop 65 listings are level "possible".
- **Reuse terms:** not yet checked; OEHHA is a California state agency. **Owner to confirm** before a wide release.

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

## cosing.csv

- **Source:** EU CosIng, cosmetic ingredients inventory - https://ec.europa.eu/growth/tools-databases/cosing/
- **How it was obtained (2026-11-13):** CosIng offers no bulk download or export (only a per-ingredient PDF).
  `node scripts/fetch-cosing.mjs` calls the same public search API the CosIng website uses, with the API key
  from the site's own public config, and writes `cosing.csv`. It refuses to write unless the row count equals
  the API's total. Re-run it at each 6-month refresh. The API is unofficial for this use and may change.
- **API quirks the script handles:** at most 10,000 rows per query and 200 per page; paging order is not
  stable; range filters do not partition reliably; one substanceId can hold two ingredients. The script
  queries exact substanceId batches of 100 (each fits one page) and keys rows by the record reference.
- **Rows:** 33,658 ingredients (30,398 marked Active, 3,260 with no status).
- **Reuse terms:** Commission content is CC BY 4.0 (https://commission.europa.eu/legal-notice_en): credit the
  source and indicate changes.
- **Columns:** `INCI name`, `CAS No` (one or more, separated by `/`, sometimes with notes like `(generic)`),
  `Function` (comma-separated, capitals), `Restriction` (`II/<n>` = Annex II, banned in EU cosmetics; other
  annexes or free text otherwise), `Status`.
- **Merging:** rows sharing a first CAS number merge. A secondary CAS number held by two entries is kept only
  where it is the main number. Entries with the same main name merge, so a label name never resolves to an
  unlisted twin of a listed substance (for example lead acetate under two CAS numbers).

## edlists.csv

- **Source:** EU Endocrine Disruptor Lists, https://edlists.org, run by national authorities of several EU
  countries and administered by the Danish Environmental Protection Agency. Collected 2026-11-16 by
  `node scripts/fetch-edlists.mjs`, which reads the table on each list's web page (the site's Excel export
  refuses scripted requests). Pages are kept in `original/edlists/` (git-ignored).
- **Reuse terms:** the site states no licence. The rows are regulatory facts (substance, list, status, year)
  and every listing links back to the list. **Owner to confirm** with the site if the app is published widely.
- **Columns:** `Name` (names separated by `;`), `CAS` (one or more), `EC`, `Health effects`,
  `Environmental effects`, `Status`, `Year`, `Regulatory field`, `List`.
- **Use:** hazard `hormone`, off by default; the person turns it on per product. Only rows with
  `Health effects` = Yes are used (many List I rows concern wildlife only). List I = strong ("Identified as an
  endocrine disruptor at EU level"); List II ("Under EU evaluation") and List III ("Considered an endocrine
  disruptor by a national authority") = possible. Hand-written notes are not required for hormone-only
  entries; the result shows the ingredient's function instead.

## eu-fragrance-allergens.csv

- **Source:** EU CosIng (CC BY 4.0), Annex III substances whose condition says their presence must be indicated
  in the list of ingredients above 0.001% (leave-on) / 0.01% (rinse-off): the EU fragrance-allergen rule,
  including the 2023 additions (Regulation (EU) 2023/1545). Collected 2026-11-16 by
  `node scripts/fetch-fragrance-allergens.mjs`; 65 entries (some name several substances, e.g. Citral; Geranial; Neral).
- **Columns:** `Name` (label names, `;`-separated), `Chemical name`, `CAS`, `Annex III ref`.
- **Use:** marks matching entries (by CAS or label name) with `fragranceAllergen`; shown as an "Allergen:
  fragrance" tag. Never a listing or verdict. CosIng shares one CAS across some plant oils and extracts, so a few
  related extracts are also marked.
- **Food allergens** are not a data file: `src/reference/foodAllergens.ts` holds the 14 EU groups (Regulation (EU)
  No 1169/2011, Annex II) as hand-checked whole-word patterns, tested in `foodAllergens.test.ts`.

## gsrs-names.csv

- **Source:** US FDA Global Substance Registration System (GSRS), UNII names file,
  https://precision.fda.gov/uniisearch/archive (public US government data). Collected 2026-11-13 from the
  4 Aug 2026 release by `node scripts/fetch-gsrs.mjs`, which downloads `UNIIs.zip` into `original/gsrs/`
  (git-ignored) and keeps only substances sharing a name with cosing.csv, fda-saf.csv or ntp.csv.
- **Columns:** `UNII`, `Name`, `Type` (`of` official, `cn` common, `sys` systematic; codes and brand names are dropped).
- **Use:** a name source, not an inventory and never a hazard list. A substance is linked to one of our entries by
  its official or systematic names (brackets removed, so "Cocos Nucifera (Coconut) Oil" finds "Cocos Nucifera Oil"),
  then its common names become aliases ("Coconut Oil"). Ranking: official names from the other sources always win;
  a common name is added only if no entry already uses it and no other GSRS substance claims it. If its names
  reach several unflagged entries it joins the shortest-named (base) one; if a flagged entry is among them it is
  skipped. Codes, "impurity" names, dotted chemical names and single vague words ("oil") are not added.

## Hand-checked aliases (`data/overrides/aliases.csv`)

Columns `name` (an existing official name) and `alias` (a label word). Ranked above GSRS and below official
names, with the same clash rules. Current rows: Fragrance and Perfume for PARFUM, Vitamin E for TOCOPHEROL.

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
