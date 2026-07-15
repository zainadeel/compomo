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

/** Pure viewport-fixed anchored-popup layout math shared by menus and selects. */
export function computeAnchoredPopupPosition(
  input: AnchoredPopupPositionInput,
): { x: number; y: number } {
  const {
    anchorRect: anchor,
    popupWidth,
    popupHeight,
    side,
    align,
    sideOffsetPx,
    alignOffsetPx,
    viewportPadPx,
    viewportWidth,
    viewportHeight,
  } = input;

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
    x: Math.min(Math.max(x, viewportPadPx), viewportWidth - popupWidth - viewportPadPx),
    y: Math.min(Math.max(y, viewportPadPx), viewportHeight - popupHeight - viewportPadPx),
  };
}
