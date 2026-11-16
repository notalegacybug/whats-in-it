# Google Play listing: draft for the owner

Copy these into Play Console. Everything here matches what the app actually does (checked against the code
on 16 November 2026). Wording avoids health claims: the app never says a product is "safe".

## App details

- **App name** (30 characters max): `Ingredient Safety` (owner may rename; Play is cautious about names that
  sound like a safety guarantee. Alternatives: `What's In It - Label Check`, `Label Lookup: Ingredients`).
- **Short description** (80 max):
  `Check food and cosmetic labels against cancer, hormone and allergen lists.` (74)
- **Category:** Tools (Health & Fitness is possible, but Tools avoids health-app declarations the app does not need).
- **Contact email:** owner's choice (shown publicly on the listing).
- **Privacy policy URL:** `https://whats-in-it.pages.dev/privacy`

## Full description (4000 max)

```
Tired of researching every ingredient yourself? Take a photo of a food or cosmetic label, or paste the
ingredient list, and see which ingredients appear on published hazard and allergen lists.

WHAT IT CHECKS
- Cancer hazard lists: US National Toxicology Program (Report on Carcinogens) and California Proposition 65.
- Optional hormone and reproductive check: EU Endocrine Disruptor Lists and California Proposition 65.
- Allergens: EU fragrance allergens that cosmetics must name, the 14 major food allergens, and the label's
  own "may contain" warning.

EACH RESULT SHOWS
- Which ingredients are on a list, how strong the listing is, and the source and year.
- A short note on what the ingredient is and what it is used for.
- Ingredients the app could not recognise, so you know what it did not check.

HANDY TOOLS
- Reads photos and screenshots on your phone, offline.
- Picks ingredient names out of a product description when there is no list.
- Suggests the full name when a label uses a short one.
- Add your own research to ingredients the app does not know.
- Save products, search them, and delete them. Light and dark themes.

PRIVATE BY DESIGN
No account, no ads, no tracking. Photos are read on your phone and never uploaded. Your saved products stay
on your phone.

PLEASE NOTE
Results show whether an ingredient appears on published lists. A listing describes a hazard, not the risk
from a particular product. This app is not medical advice.
```

## Data safety form (Play Console > App content > Data safety)

| Question | Answer | Why |
| --- | --- | --- |
| Does your app collect or share any of the required user data types? | **No** | Nothing leaves the phone except downloads of public reference files. |
| Is all user data encrypted in transit? | Yes | The site is HTTPS only. |
| Do you provide a way for users to request data deletion? | Not applicable (no data collected); users can delete saved products in the app. | |

Camera: used only when the person taps "Take a photo"; the image is processed on the device.

## Content rating questionnaire

Category: **Reference, News, or Educational** (or Utility). No violence, sexual content, profanity,
gambling, user-to-user interaction, or location sharing. Expected rating: Everyone / PEGI 3.

## Other App content declarations

- **Ads:** No ads.
- **Target audience:** 18+ (adults checking products); not designed for children.
- **Health apps declaration:** if asked, choose that the app is not a medical device and provides general
  information only.
- **News app:** No. **Government app:** No. **Financial features:** None.

## Graphics needed

- **App icon:** 512 x 512 PNG: `public/icons/icon-512.png`.
- **Feature graphic:** 1024 x 500 PNG (to make).
- **Phone screenshots:** 2 to 8, e.g. home screen, a result with a "Watch for" item, the hormone check, dark
  theme. Take them on your phone from the live app.

## Before submitting

- Settle reuse terms for Prop 65 and the EU Endocrine Disruptor Lists (see `NEXT-STEPS.md`).
- Closed test: 12 testers for 14 days (personal account created after November 2023).
