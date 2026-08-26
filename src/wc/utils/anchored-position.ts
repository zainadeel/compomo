export type AnchoredSide = 'top' | 'right' | 'bottom' | 'left';
export type AnchoredAlign = 'start' | 'center' | 'end';

export type AnchoredCollisionRect = Pick<
  DOMRectReadOnly,
  'top' | 'left' | 'right' | 'bottom' | 'width' | 'height'
>;

export interface AnchoredPositionInput {
  anchorRect: Pick<DOMRectReadOnly, 'top' | 'left' | 'right' | 'bottom' | 'width' | 'height'>;
  popupWidth: number;
  popupHeight: number;
  side: AnchoredSide;
  align: AnchoredAlign;
  sideOffsetPx: number;
  alignOffsetPx: number;
  viewportPadPx: number;
  viewportWidth: number;
  viewportHeight: number;
  /** Optional page or panel collision rectangle in viewport-fixed coordinates. */
  collisionRect?: AnchoredCollisionRect;
}

export interface AnchoredPosition {
  x: number;
  y: number;
  /** Side actually used, which differs from the request when placement flipped. */
  resolvedSide: AnchoredSide;
  /** Vertical room available on the resolved side inside the padded viewport. */
  availableHeight: number;
}

const OPPOSITE_SIDE: Record<AnchoredSide, AnchoredSide> = {
  top: 'bottom',
  right: 'left',
  bottom: 'top',
  left: 'right',
};

/** Unclamped coordinates for one candidate side. */
function rawPosition(
  input: AnchoredPositionInput,
  side: AnchoredSide,
): Pick<AnchoredPosition, 'x' | 'y'> {
  const { anchorRect: anchor, popupWidth, popupHeight, align, sideOffsetPx, alignOffsetPx } = input;

  if (side === 'top' || side === 'bottom') {
    return {
      x:
        align === 'start'
          ? anchor.left + alignOffsetPx
          : align === 'end'
            ? anchor.right - popupWidth + alignOffsetPx
            : anchor.left + anchor.width / 2 - popupWidth / 2 + alignOffsetPx,
      y: side === 'top'
        ? anchor.top - popupHeight - sideOffsetPx
        : anchor.bottom + sideOffsetPx,
    };
  }

  return {
    x: side === 'left'
      ? anchor.left - popupWidth - sideOffsetPx
      : anchor.right + sideOffsetPx,
    y:
      align === 'start'
        ? anchor.top + alignOffsetPx
        : align === 'end'
          ? anchor.bottom - popupHeight + alignOffsetPx
          : anchor.top + anchor.height / 2 - popupHeight / 2 + alignOffsetPx,
  };
}

/** Total main-axis spill past the padded viewport for a candidate position. */
function collisionBounds(input: AnchoredPositionInput) {
  const boundary = input.collisionRect ?? {
    top: 0,
    left: 0,
    right: input.viewportWidth,
    bottom: input.viewportHeight,
  };
  return {
    top: boundary.top + input.viewportPadPx,
    left: boundary.left + input.viewportPadPx,
    right: boundary.right - input.viewportPadPx,
    bottom: boundary.bottom - input.viewportPadPx,
  };
}

function mainAxisOverflow(
  input: AnchoredPositionInput,
  side: AnchoredSide,
  position: Pick<AnchoredPosition, 'x' | 'y'>,
): number {
  const { popupWidth, popupHeight } = input;
  const bounds = collisionBounds(input);

  if (side === 'top' || side === 'bottom') {
    return Math.max(bounds.top - position.y, 0) +
      Math.max(position.y + popupHeight - bounds.bottom, 0);
  }

  return Math.max(bounds.left - position.x, 0) +
    Math.max(position.x + popupWidth - bounds.right, 0);
}

function clampToBounds(value: number, size: number, minimum: number, maximumEdge: number): number {
  const maximum = Math.max(minimum, maximumEdge - size);
  return Math.min(Math.max(value, minimum), maximum);
}

/**
 * Pure viewport-fixed anchored-popup layout math shared by every element-anchored
 * overlay: menus, selects, tooltips, and anchored toasts.
 *
 * `side` is preferred. When the popup spills past the padded collision boundary and
 * the opposite side spills less, placement flips on the main axis; the result is
 * then clamped into that boundary on both axes. The viewport is the fallback when
 * no page or panel collision rectangle is supplied. Cross-axis `align` is applied
 * before clamping so `alignOffsetPx` stays an additive nudge.
 *
 * Callers own their own anchor semantics — inner-cell alignment offsets and
 * minimum widths belong to the calling component, not here.
 * @see choice-popup-alignment.ts for the choice-cell alignment transform.
 */
export function computeAnchoredPosition(input: AnchoredPositionInput): AnchoredPosition {
  const bounds = collisionBounds(input);
  const preferred = rawPosition(input, input.side);
  const oppositeSide = OPPOSITE_SIDE[input.side];
  const opposite = rawPosition(input, oppositeSide);
  const preferredOverflow = mainAxisOverflow(input, input.side, preferred);
  const oppositeOverflow = mainAxisOverflow(input, oppositeSide, opposite);
  const useOpposite = preferredOverflow > 0 && oppositeOverflow < preferredOverflow;
  const resolvedSide = useOpposite ? oppositeSide : input.side;
  const position = useOpposite ? opposite : preferred;
  const availableHeight =
    resolvedSide === 'top'
      ? input.anchorRect.top - bounds.top - input.sideOffsetPx
      : resolvedSide === 'bottom'
        ? bounds.bottom - input.anchorRect.bottom - input.sideOffsetPx
        : bounds.bottom - bounds.top;

  return {
    x: clampToBounds(position.x, input.popupWidth, bounds.left, bounds.right),
    y: clampToBounds(position.y, input.popupHeight, bounds.top, bounds.bottom),
    resolvedSide,
    availableHeight: Math.max(0, availableHeight),
  };
}
