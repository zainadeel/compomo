import {
  computeAnchoredPosition,
  type AnchoredAlign,
  type AnchoredPositionInput,
  type AnchoredSide,
} from '../../utils/anchored-position';

export type MenuSide = AnchoredSide;
export type MenuAlign = AnchoredAlign;
export type MenuPositionInput = AnchoredPositionInput;

/** Backward-compatible menu alias for the shared anchored-position layout math. */
export const computeMenuPosition = computeAnchoredPosition;
