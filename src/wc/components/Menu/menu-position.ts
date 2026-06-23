export type MenuSide = 'top' | 'right' | 'bottom' | 'left';
export type MenuAlign = 'start' | 'center' | 'end';

export interface MenuPositionInput {
  anchorRect: Pick<DOMRectReadOnly, 'top' | 'left' | 'right' | 'bottom' | 'width' | 'height'>;
  popupWidth: number;
  popupHeight: number;
  side: MenuSide;
  align: MenuAlign;
  sideOffsetPx: number;
  alignOffsetPx: number;
  viewportPadPx: number;
  viewportWidth: number;
  viewportHeight: number;
}

/** Pure layout math for ds-menu — anchor rect + placement props → viewport-fixed x/y. */
export function computeMenuPosition(input: MenuPositionInput): { x: number; y: number } {
  const {
    anchorRect: a,
    popupWidth: pw,
    popupHeight: ph,
    side,
    align,
    sideOffsetPx,
    alignOffsetPx,
    viewportPadPx: vpPad,
    viewportWidth,
    viewportHeight,
  } = input;

  let x = 0;
  let y = 0;

  switch (side) {
    case 'top':
      y = a.top - ph - sideOffsetPx;
      x =
        align === 'start'
          ? a.left + alignOffsetPx
          : align === 'end'
            ? a.right - pw + alignOffsetPx
            : a.left + a.width / 2 - pw / 2 + alignOffsetPx;
      break;
    case 'bottom':
      y = a.bottom + sideOffsetPx;
      x =
        align === 'start'
          ? a.left + alignOffsetPx
          : align === 'end'
            ? a.right - pw + alignOffsetPx
            : a.left + a.width / 2 - pw / 2 + alignOffsetPx;
      break;
    case 'left':
      x = a.left - pw - sideOffsetPx;
      y =
        align === 'start'
          ? a.top + alignOffsetPx
          : align === 'end'
            ? a.bottom - ph + alignOffsetPx
            : a.top + a.height / 2 - ph / 2 + alignOffsetPx;
      break;
    case 'right':
      x = a.right + sideOffsetPx;
      y =
        align === 'start'
          ? a.top + alignOffsetPx
          : align === 'end'
            ? a.bottom - ph + alignOffsetPx
            : a.top + a.height / 2 - ph / 2 + alignOffsetPx;
      break;
  }

  return {
    x: Math.min(Math.max(x, vpPad), viewportWidth - pw - vpPad),
    y: Math.min(Math.max(y, vpPad), viewportHeight - ph - vpPad),
  };
}
