import type { AnchoredPopupAlign } from './anchored-popup';

/**
 * `choice-cell` aligns the first/last interactive row edge with the anchor,
 * allowing the popup frame to extend by the section inset. `popup-frame`
 * aligns the popup frame itself and is reserved for deliberate custom geometry.
 */
export type ChoicePopupAnchorAlignment = 'choice-cell' | 'popup-frame';

export interface ChoicePopupAlignOffsetInput {
  align: AnchoredPopupAlign;
  alignOffsetPx: number;
  sectionInsetPx: number;
  anchorAlignment?: ChoicePopupAnchorAlignment;
}

/**
 * Resolve the cross-axis offset for a choice popup. Authored `alignOffsetPx`
 * remains an additive nudge after the shared inner-cell alignment is applied.
 */
export function resolveChoicePopupAlignOffset({
  align,
  alignOffsetPx,
  sectionInsetPx,
  anchorAlignment = 'choice-cell',
}: ChoicePopupAlignOffsetInput): number {
  if (anchorAlignment === 'popup-frame' || align === 'center') return alignOffsetPx;
  return alignOffsetPx + (align === 'start' ? -sectionInsetPx : sectionInsetPx);
}

/** Minimum popup width that keeps both choice-cell edges aligned to a trigger. */
export function choicePopupMinWidth(anchorWidth: number, sectionInsetPx: number): number {
  return anchorWidth + sectionInsetPx * 2;
}
