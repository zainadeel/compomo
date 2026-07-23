export type AnchoredPopupSide = 'top' | 'right' | 'bottom' | 'left';
export type AnchoredPopupAlign = 'start' | 'center' | 'end';

export interface AnchoredPopupPositionInput {
  anchorRect: Pick<DOMRectReadOnly, 'top' | 'left' | 'right' | 'bottom' | 'width' | 'height'>;
  popupWidth: number;
  popupHeight: number;
  side: AnchoredPopupSide;
  align: AnchoredPopupAlign;
  sideOffsetPx: number;
  alignOffsetPx: number;
  viewportPadPx: number;
  viewportWidth: number;
  viewportHeight: number;
}

const OPPOSITE_SIDE: Record<AnchoredPopupSide, AnchoredPopupSide> = {
  top: 'bottom',
  right: 'left',
  bottom: 'top',
  left: 'right',
};

function availableMainAxisSpace(
  side: AnchoredPopupSide,
  input: AnchoredPopupPositionInput,
): number {
  const { anchorRect: anchor, sideOffsetPx, viewportPadPx, viewportWidth, viewportHeight } = input;
  switch (side) {
    case 'top':
      return anchor.top - viewportPadPx - sideOffsetPx;
    case 'right':
      return viewportWidth - viewportPadPx - anchor.right - sideOffsetPx;
    case 'bottom':
      return viewportHeight - viewportPadPx - anchor.bottom - sideOffsetPx;
    case 'left':
      return anchor.left - viewportPadPx - sideOffsetPx;
  }
}

function resolveAnchoredPopupSide(input: AnchoredPopupPositionInput): AnchoredPopupSide {
  const preferredSpace = availableMainAxisSpace(input.side, input);
  const oppositeSide = OPPOSITE_SIDE[input.side];
  const oppositeSpace = availableMainAxisSpace(oppositeSide, input);
  const popupSize = input.side === 'top' || input.side === 'bottom'
    ? input.popupHeight
    : input.popupWidth;

  return popupSize > preferredSpace && oppositeSpace > preferredSpace
    ? oppositeSide
    : input.side;
}

function clampToViewport(value: number, size: number, viewportSize: number, padding: number): number {
  const maximum = Math.max(padding, viewportSize - size - padding);
  return Math.min(Math.max(value, padding), maximum);
}

/**
 * Pure viewport-fixed anchored-popup layout math shared by menus and selects.
 * `side` is preferred: when the popup does not fit there and the opposite side
 * has more room, placement flips on the main axis before viewport clamping.
 */
export function computeAnchoredPopupPosition(
  input: AnchoredPopupPositionInput,
): { x: number; y: number } {
  const {
    anchorRect: anchor,
    popupWidth,
    popupHeight,
    align,
    sideOffsetPx,
    alignOffsetPx,
    viewportPadPx,
    viewportWidth,
    viewportHeight,
  } = input;
  const side = resolveAnchoredPopupSide(input);

  let x = 0;
  let y = 0;

  switch (side) {
    case 'top':
      y = anchor.top - popupHeight - sideOffsetPx;
      x =
        align === 'start'
          ? anchor.left + alignOffsetPx
          : align === 'end'
            ? anchor.right - popupWidth + alignOffsetPx
            : anchor.left + anchor.width / 2 - popupWidth / 2 + alignOffsetPx;
      break;
    case 'bottom':
      y = anchor.bottom + sideOffsetPx;
      x =
        align === 'start'
          ? anchor.left + alignOffsetPx
          : align === 'end'
            ? anchor.right - popupWidth + alignOffsetPx
            : anchor.left + anchor.width / 2 - popupWidth / 2 + alignOffsetPx;
      break;
    case 'left':
      x = anchor.left - popupWidth - sideOffsetPx;
      y =
        align === 'start'
          ? anchor.top + alignOffsetPx
          : align === 'end'
            ? anchor.bottom - popupHeight + alignOffsetPx
            : anchor.top + anchor.height / 2 - popupHeight / 2 + alignOffsetPx;
      break;
    case 'right':
      x = anchor.right + sideOffsetPx;
      y =
        align === 'start'
          ? anchor.top + alignOffsetPx
          : align === 'end'
            ? anchor.bottom - popupHeight + alignOffsetPx
            : anchor.top + anchor.height / 2 - popupHeight / 2 + alignOffsetPx;
      break;
  }

  return {
    x: clampToViewport(x, popupWidth, viewportWidth, viewportPadPx),
    y: clampToViewport(y, popupHeight, viewportHeight, viewportPadPx),
  };
}
