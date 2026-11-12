import type { Verdict } from './reference/types';

export const VERDICT_LABEL: Record<Verdict, string> = {
  watch_strong: 'Watch for (strong evidence)',
  watch_possible: 'Watch for (possible)',
  no_known_concern: 'No known concern on these lists',
  not_recognised: 'Not recognised',
};

export const DISCLAIMER =
  'Not medical advice. Results show whether an ingredient appears on published cancer hazard lists. A listing describes a hazard, not the risk from this product.';

export const OCR_EMPTY_MESSAGE = "We couldn't read any ingredients. Type or paste them below.";
