# Ingredient Safety App: Design (V1)

Date: 2026-11-12
Status: draft, awaiting owner approval

Items marked **[builder's call]** were chosen by the design author, not by the owner. Everything else is what the owner said.

## 1. Intent and why

The owner regularly photographs ingredient labels (food and cosmetics) and asks a chatbot whether anything in them is linked to cancer. It works, but it has three pains:

1. Nothing is saved, so the same product gets researched again and again.
2. There is no way to see patterns, such as a brand that repeatedly uses problem ingredients.
3. The chatbot's claims are hard to trust or verify.

The app replaces that routine for the owner and for anyone else who does the same research. It must be free to use, because the owner would not pay for it themselves and would fall back to a chatbot.

## 2. Goals

- Take an ingredient list and sort every ingredient into "watch for" or "no known concern".
- For each ingredient show a very short note: what it is and where it comes from.
- For each "watch for" verdict show a citation the user can look up: source name and year.
- Save every analysed product so it never has to be researched twice.
- Shared product library: a product analysed by one person is returned instantly to the next person who looks it up.
- Private "my scans" list so a person can revisit what they looked at.
- Store no personal information.
- Run at zero or near-zero cost at small scale.
- Ship as a web app and an Android app (owner has a Google Play developer account).

## 3. Non-goals for V1

- iPhone App Store release. iPhone users use the web app. Reason: Apple's 99 USD yearly fee.
- Product links as input. Deferred to V2 (section 11).
- Accounts, login, or syncing a private list between devices.
- Ads or paid features. Monetisation is deferred; the plan is donations first, ads only once there is regular usage.
- Brand-level reports. V1 only stores the data that makes them possible later (brand on every product record).
- Labels in languages other than English (owner decided). Other languages come later.
- Harm categories other than cancer (allergens, hormone disruption, and so on). The data model should not prevent adding them.

## 4. Anti-goals (failure even if it technically works)

- **Invented or unverifiable citations.** Every verdict must trace to a real published list.
- **Calling something "safe".** Absence from the lists means "no known concern on these lists", and the wording must say so.
- **The same product giving different verdicts on different days** without the reference data having changed.
- **A per-scan running cost** that forces the app to charge users.
- **Statements about brands or products that go beyond the facts.** The app says "contains N ingredients listed by source X", never "this brand is dangerous".
- **Presenting itself as medical advice.**

## 5. How verdicts work (owner agreed)

Verdicts never come from an AI at scan time. They come from a fixed **ingredient reference** built from published authority lists:

| Source | What it provides |
|---|---|
| IARC Monographs (WHO cancer agency) | Classification groups 1, 2A, 2B |
| US National Toxicology Program, Report on Carcinogens | "Known" and "reasonably anticipated" carcinogens |
| California Proposition 65 list | Chemicals listed for cancer |
| EU harmonised classification (CLP Regulation, Annex VI) | Carcinogen categories 1A, 1B, 2 |

**[builder's call]** The fourth source was first described to the owner as "EU banned and restricted cosmetic ingredients". Those lists (Cosmetics Regulation Annex II and III) ban or limit substances for many reasons other than cancer, so using them whole would flag ordinary products as cancer concerns. The EU's carcinogen classifications are used instead, because every entry is specifically about cancer. Where a carcinogen-classified substance is also banned in EU cosmetics, the entry says so as extra context.

**[builder's call]** Product type (food or cosmetic) does not change which sources apply. Every listing for an ingredient is shown, and the context caveat explains when a listing concerns a different route of exposure. Type is stored for search, filtering and later brand reports.

**Known-ingredient catalogue [builder's call].** The four sources only list flagged substances. To tell "checked and clear" apart from "not recognised", the reference also includes a catalogue of ordinary ingredients, seeded from open inventories: the EU CosIng inventory of cosmetic ingredient names and functions, and public food-additive lists (E-numbers, FDA Substances Added to Food). For these entries the short note is the inventory's own function description (for example "humectant", "preservative"). Hand-checked fuller notes are written for every flagged entry and for the few hundred most common ingredients, not for all tens of thousands.

Each reference entry holds:

- canonical name
- aliases: INCI name, common names, E-number, CAS number
- for each source that lists it: source name, classification, year, and a URL or document reference
- a short context caveat where the listing depends on route or form (for example, listed for inhalation as a powder, which differs from use in a cream)
- a short plain-language note: what it is, where it comes from

The short notes are written once, ahead of time, when the reference is built. An AI may draft them, but they are reviewed and stored as data. Nothing is generated per scan.

**[builder's call]** Verdict levels shown to the user:

- **Watch for (strong evidence):** IARC 1, NTP "known", or EU category 1A or 1B.
- **Watch for (possible):** IARC 2A or 2B, NTP "reasonably anticipated", Prop 65 cancer listing, or EU category 2.
- **No known concern on these lists:** matched to a known ingredient but not listed, or not matched at all. Unmatched ingredients are visibly marked "not recognised" so the user knows the app did not check them, as distinct from checked and clear.

**[builder's call]** The reference carries a version number. Each saved product records which reference version produced its verdicts, and verdicts are recomputed when the reference is updated.

**Keeping the reference current (owner decided).** The owner refreshes the reference every 6 months to begin with, and may change that pace as the user base grows. The build must therefore be a repeatable script that re-pulls the source lists and reports what changed, not a one-off manual job.

**Sign-off before launch [builder's call, owner did not choose explicitly].** Flagged entries are generated directly from the official lists, so their classifications need no human judgement. The owner spot-checks a sample of the short notes rather than approving every entry.

Rejected alternative: ask an AI to judge each ingredient live. Faster to build and covers every ingredient, but citations cannot be trusted, results vary between runs, and it costs money per scan.

## 6. Inputs (V1)

1. **Photo** of a physical label, taken in the app.
2. **Screenshot** or saved image of an online product page.
3. **Barcode** scan, as an optional shortcut to an existing library record. Many online products have no barcode, so nothing may depend on it.

**[builder's call]** Also allow typing or pasting ingredient text into the correction screen described below; it costs almost nothing once that screen exists.

Text is read from images **on the device**, with no server or paid AI call. On-device reading is less accurate than a chatbot on blurry or curved labels, so there is always a **review and correct** step: the app shows the ingredients it read as an editable list before analysing.

## 7. User flow

1. Open the app. Choose: scan barcode, take photo, or pick an image.
2. Barcode path: if the barcode is in the shared library, show the saved result and stop.
3. Otherwise read text from the image, find the ingredients section, split it into individual ingredients.
4. User reviews and corrects the list.
5. User enters product name, brand, and type (food or cosmetic). Barcode is attached if one was scanned.
6. App checks the shared library for a close match (section 8). If found, ask "Is this the same as X?". Yes: show the saved result. No: continue.
7. App matches each ingredient to the reference and shows results: "watch for" items first with level, note, citation and caveat; then the rest.
8. Product is saved to the shared library and added to the user's private list.
9. "My scans" screen lists past products; tapping one reopens its result.
10. Search screen: look up a product in the shared library by name or brand.

A short "not medical advice; based on these published lists" statement appears on the results screen and in an About page that names the sources.

## 8. Saved data

**Shared library (server).** One record per product:

- product name, brand, type (food or cosmetic)
- barcode, optional
- ingredient list as corrected by the user, plus the matched reference ids
- reference version used
- created date

No user identifier, device identifier, or image is stored. Images never leave the device.

**Matching a product to an existing record [builder's call]:** barcode if present; otherwise normalised brand plus product name, with ingredient-list similarity as tie-breaker. Close matches are confirmed by the user, never merged silently.

**Private list (device only) [builder's call]:** a list of shared-library product ids with the date scanned, kept in the app's local storage. It does not follow the user to a new device. That is the accepted cost of having no accounts.

**Protecting a library anyone can write to [builder's call]:**

- Clients send only product name, brand, type, barcode and ingredient text. Verdicts are computed from the reference and are never accepted from a client.
- Writes go through a rate-limited server endpoint, not direct database access.
- Records are never overwritten by another user. A differing ingredient list for the same product is stored as a new version, and the newest is shown.
- Length limits and basic input cleaning on all fields.

**Fixing wrong records (owner decided).** Every result screen has a "report a problem" button. A report stores the product id, a reason and optional free text, with no user identifier, in a table only the owner can read. The owner hides or corrects records by hand in the database dashboard. No admin screens are built for V1. Records need a "hidden" flag that removes them from lookups and search.

## 9. Technology [builder's call, all of it]

The owner set the constraints (zero cost, web plus Android) and handed the choices over.

- **One web codebase** in TypeScript with React, built as an installable web app.
- **Android app** made by wrapping that same web app with Capacitor and publishing to Google Play.
- **Text reading:** Tesseract.js in the browser. On Android, optionally Google ML Kit through a Capacitor plugin if accuracy needs it.
- **Barcode:** a JavaScript barcode library using the camera.
- **Ingredient reference:** shipped with the app as a static data file, so matching works offline and costs nothing.
- **Shared library:** Supabase free tier (hosted Postgres), written through a server function that enforces the rules in section 8.
- **Private list:** IndexedDB on the device.
- **Hosting:** a free static host (for example Cloudflare Pages).

Rejected alternative: Flutter. It also gives one codebase and a more native Android feel, but its web output is heavier and slower to load, and the web app is a first-class target here, serving every iPhone user.

**Android release constraint.** The owner's Google Play account is a personal account created after November 2023. Google requires such accounts to run a closed test (about 12 testers opted in for 14 days; confirm the current numbers in the Play Console) before a public release. The release plan must include recruiting testers and that waiting period. The web app can go live without waiting for it.

Costs that remain: none at small scale. Free tiers have usage caps; the design keeps server use to small text records so those caps are far away.

## 10. Left to the builder

- Building the reference: gathering the four lists, merging entries for the same substance, building the alias table, drafting and checking the short notes. This is the largest single piece of work. Confirm each source's reuse terms before bundling its data.
- How to find the ingredients section in messy recognised text and split it (commas, brackets, "may contain", percentages, mixed languages).
- Fuzzy matching of misspelt or misread ingredient names to the reference, and the threshold for "not recognised".
- Screen design and wording, within the anti-goals.
- Tests. At minimum: reference matching, verdict rules, ingredient splitting, product matching.

## 11. Later (not V1)

- **Product links (V2).** The owner wants to paste a product link and have the app fetch the ingredients, using an AI that runs on the device or in the cloud. Stores block automated fetching, so the planned approach is for the app to open the page in its own built-in browser, as the user, and then have an on-device or cloud AI extract the ingredient list. Verdicts still come from the reference.
- Brand reports: which brands most often use listed ingredients.
- Donations, then possibly ads.
- iPhone App Store release.
- More harm categories.
