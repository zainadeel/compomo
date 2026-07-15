import {
  computeAnchoredPopupPosition,
  type AnchoredPopupAlign,
  type AnchoredPopupPositionInput,
  type AnchoredPopupSide,
} from '../../utils/anchored-popup';

export type MenuSide = AnchoredPopupSide;
export type MenuAlign = AnchoredPopupAlign;
export type MenuPositionInput = AnchoredPopupPositionInput;

/** Backward-compatible menu alias for the shared anchored-popup layout math. */
export const computeMenuPosition = computeAnchoredPopupPosition;
