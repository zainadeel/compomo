import type { TooltipAlign, TooltipSide } from './Tooltip';

export interface TooltipPositionInput {
  anchorRect: Pick<DOMRectReadOnly, 'top' | 'left' | 'right' | 'bottom' | 'width' | 'height'>;
  popupWidth: number;
  popupHeight: number;
  side: TooltipSide;
  align: TooltipAlign;
  sideOffsetPx: number;
  alignOffsetPx: number;
  viewportPadPx: number;
  viewportWidth: number;
  viewportHeight: number;
}

export interface TooltipPosition {
  x: number;
  y: number;
  resolvedSide: TooltipSide;
}

const OPPOSITE_SIDE: Record<TooltipSide, TooltipSide> = {
  top: 'bottom',
  right: 'left',
  bottom: 'top',
  left: 'right',
};

function rawPosition(
  input: TooltipPositionInput,
  side: TooltipSide,
): Pick<TooltipPosition, 'x' | 'y'> {
  const {
    anchorRect: anchor,
    popupWidth,
    popupHeight,
    align,
    sideOffsetPx,
    alignOffsetPx,
  } = input;

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

function mainAxisOverflow(
  input: TooltipPositionInput,
  side: TooltipSide,
  position: Pick<TooltipPosition, 'x' | 'y'>,
): number {
  const {
    popupWidth,
    popupHeight,
    viewportPadPx,
    viewportWidth,
    viewportHeight,
  } = input;

  if (side === 'top' || side === 'bottom') {
    return Math.max(viewportPadPx - position.y, 0) +
      Math.max(position.y + popupHeight - (viewportHeight - viewportPadPx), 0);
  }

  return Math.max(viewportPadPx - position.x, 0) +
    Math.max(position.x + popupWidth - (viewportWidth - viewportPadPx), 0);
}

/** Flip on the preferred axis when needed, then clamp within the viewport. */
export function computeTooltipPosition(input: TooltipPositionInput): TooltipPosition {
  const preferred = rawPosition(input, input.side);
  const oppositeSide = OPPOSITE_SIDE[input.side];
  const opposite = rawPosition(input, oppositeSide);
  const preferredOverflow = mainAxisOverflow(input, input.side, preferred);
  const oppositeOverflow = mainAxisOverflow(input, oppositeSide, opposite);
  const useOpposite = preferredOverflow > 0 && oppositeOverflow < preferredOverflow;
  const resolvedSide = useOpposite ? oppositeSide : input.side;
  const position = useOpposite ? opposite : preferred;
  const maxX = Math.max(input.viewportPadPx, input.viewportWidth - input.popupWidth - input.viewportPadPx);
  const maxY = Math.max(input.viewportPadPx, input.viewportHeight - input.popupHeight - input.viewportPadPx);

  return {
    x: Math.min(Math.max(position.x, input.viewportPadPx), maxX),
    y: Math.min(Math.max(position.y, input.viewportPadPx), maxY),
    resolvedSide,
  };
}
