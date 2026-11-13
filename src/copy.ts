import type { SourceId, Verdict } from './reference/types';

export const VERDICT_LABEL: Record<Verdict, string> = {
  watch_strong: 'Watch for (strong evidence)',
  watch_possible: 'Watch for (possible)',
  no_known_concern: 'No known concern on these lists',
  not_recognised: 'Not recognised',
};

export const DISCLAIMER =
  'Not medical advice. Results show whether an ingredient appears on published cancer hazard lists. A listing describes a hazard, not the risk from this product.';

export const OCR_EMPTY_MESSAGE = "We couldn't read any ingredients. Type or paste them below.";

export const SOURCE_LABEL: Record<SourceId, string> = {
  IARC: 'IARC',
  NTP: 'NTP',
  PROP65: 'Prop 65',
  EU_CLP: 'EU CLP',
};

/** The published lists behind the verdicts, as shown on the About screen. */
export const SOURCES_ABOUT: { id: SourceId; name: string; url: string }[] = [
  { id: 'IARC', name: 'IARC Monographs', url: 'https://monographs.iarc.who.int/list-of-classifications' },
  { id: 'NTP', name: 'US National Toxicology Program, Report on Carcinogens', url: 'https://ntp.niehs.nih.gov/go/roc' },
  { id: 'PROP65', name: 'California Proposition 65 list', url: 'https://oehha.ca.gov/proposition-65/proposition-65-list' },
  { id: 'EU_CLP', name: 'EU harmonised classification (CLP Annex VI)', url: 'https://echa.europa.eu/information-on-chemicals/annex-vi-to-clp' },
];

/** About screen: under the lists that are not in this build of the reference. */
export const NOT_YET_INCLUDED =
  'These lists are not in this version of the reference, so ingredients on them are not flagged yet.';

/** "Checked against: IARC, NTP", in SOURCES_ABOUT order; says so plainly when no hazard list is included. */
export function checkedAgainst(sources: SourceId[]): string {
  const names = SOURCES_ABOUT.filter((s) => sources.includes(s.id)).map((s) => SOURCE_LABEL[s.id]);
  return `Checked against: ${names.length ? names.join(', ') : 'no hazard lists yet'}`;
}
