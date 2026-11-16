import type { Hazard, SourceId, Verdict } from './reference/types';

export const VERDICT_LABEL: Record<Verdict, string> = {
  watch_strong: 'Watch for (strong evidence)',
  watch_possible: 'Watch for (possible)',
  no_known_concern: 'No known concern on these lists',
  not_recognised: 'Not recognised',
};

// Short per-ingredient tag, so the verdict is visible next to each name, not only in the section heading.
export const VERDICT_TAG: Record<Verdict, string> = {
  watch_strong: 'Watch for: strong evidence',
  watch_possible: 'Watch for: possible',
  no_known_concern: 'Not on lists checked',
  not_recognised: "Couldn't check",
};

export const USED_AS = 'Used as: ';

export const MY_TAG_LABEL = {
  no_concern: 'Your research: no concern',
  watch: 'Your research: watch for',
} as const;

export const YOUR_RESEARCH_CAVEAT = 'Set by you, not checked by the app. Kept on this phone only.';

export const PARTIAL_CHECK =
  'Partial check: only the ingredients named in a product description were checked. The full ingredient list may contain others.';

export function descriptionNotice(found: number): string {
  const where = "Look for the full 'Ingredients' list: on a shopping site it is usually under product details, or in a photo of the pack.";
  return found
    ? `This looks like a product description, not an ingredient list. We picked out the ${found} ingredient name${found === 1 ? '' : 's'} it mentions; descriptions rarely name them all. ${where}`
    : `This looks like a product description, not an ingredient list, and it has no ingredient names we know. ${where}`;
}

export const DISCLAIMER =
  'Not medical advice. Results show whether an ingredient appears on published cancer lists (and, when you turn it on, hormone and reproductive lists). A listing describes a hazard, not the risk from this product.';

export const OCR_EMPTY_MESSAGE = "We couldn't read any ingredients. Type or paste them below.";

export const SOURCE_LABEL: Record<SourceId, string> = {
  IARC: 'IARC',
  NTP: 'NTP',
  PROP65: 'Prop 65',
  EU_CLP: 'EU CLP',
  ED_LISTS: 'EU ED Lists',
};

export const SOURCES_ABOUT: { id: SourceId; name: string; url: string }[] = [
  { id: 'IARC', name: 'IARC Monographs', url: 'https://monographs.iarc.who.int/list-of-classifications' },
  { id: 'NTP', name: 'US National Toxicology Program, Report on Carcinogens', url: 'https://ntp.niehs.nih.gov/go/roc' },
  { id: 'PROP65', name: 'California Proposition 65 list', url: 'https://oehha.ca.gov/proposition-65/proposition-65-list' },
  { id: 'EU_CLP', name: 'EU harmonised classification (CLP Annex VI)', url: 'https://echa.europa.eu/information-on-chemicals/annex-vi-to-clp' },
];

// The optional hormone-disruptor check.
export const HORMONE_SOURCES_ABOUT: { id: SourceId; name: string; url: string }[] = [
  { id: 'ED_LISTS', name: 'EU Endocrine Disruptor Lists (lists I, II and III)', url: 'https://edlists.org/the-ed-lists' },
];
const ALL_SOURCES = [...SOURCES_ABOUT, ...HORMONE_SOURCES_ABOUT];

export const HAZARD_CHIP: Record<Hazard, string> = {
  cancer: 'Cancer list',
  hormone: 'Hormone list',
  reproductive: 'Reproductive list',
};
// One optional check covers both: hormone disruptors (EU ED Lists) and reproductive harm (Prop 65).
export const EXTRA_HAZARDS: Hazard[] = ['hormone', 'reproductive'];
export const CHECK_HORMONE = 'Check hormone & reproductive effects';
export const HIDE_HORMONE = 'Hide hormone & reproductive check';
export const HORMONE_ON =
  'Hormone & reproductive check is on for this product: ingredients are also checked against hormone-disruptor and reproductive-harm lists.';

/** The sources that answer the checks in use. */
export function sourcesFor(sources: SourceId[], hazards: Hazard[]): SourceId[] {
  const hormone = HORMONE_SOURCES_ABOUT.map((s) => s.id);
  return sources.filter((id) => (hormone.includes(id) ? hazards.includes('hormone') : hazards.includes('cancer')));
}

export const NOT_YET_INCLUDED =
  'These lists are not in this version of the reference, so ingredients on them are not flagged yet.';

export function checkedAgainst(sources: SourceId[]): string {
  const names = ALL_SOURCES.filter((s) => sources.includes(s.id)).map((s) => SOURCE_LABEL[s.id]);
  return `Checked against: ${names.length ? names.join(', ') : 'no hazard lists yet'}`;
}

// One-line answer above the details. Never says "safe": absence from these lists is not proof of safety.
export function resultSummary(
  counts: { flagged: number; unchecked: number; total: number },
  sources: SourceId[],
  hormone = false,
): string {
  const { flagged, unchecked, total } = counts;
  const couldnt = unchecked ? ` We couldn't check ${unchecked}.` : '';
  if (flagged) {
    const [verb, pronoun] = flagged === 1 ? ['is', 'It is'] : ['are', 'They are'];
    return `${flagged} of ${total} ingredients ${verb} on a ${hormone ? 'cancer, hormone or reproductive' : 'cancer'} list. ${pronoun} shown first, under "Watch for".${couldnt}`;
  }
  const names = ALL_SOURCES.filter((s) => sources.includes(s.id)).map((s) => SOURCE_LABEL[s.id]);
  const lists = hormone ? 'cancer, hormone and reproductive lists' : 'cancer lists';
  if (!names.length) return `No cancer lists are loaded yet, so nothing can be flagged.${couldnt}`;
  const n = unchecked ? total - unchecked : total;
  const noun = n === 1 ? 'ingredient' : 'ingredients';
  const subject = unchecked ? `${n} ${noun} we could check` : `${n} ${noun}`;
  const verb = n === 1 ? 'is not' : 'are';
  return n === 1
    ? `The ${subject} ${verb} on the ${lists} checked (${names.join(', ')}).${couldnt}`
    : `None of the ${subject} are on the ${lists} checked (${names.join(', ')}).${couldnt}`;
}
