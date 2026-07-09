/** Shared width fit for interactive controls (buttons, select, …). */
export type ControlWidth = 'hug' | 'fill';

/** Host / control class map for `width="hug" | "fill"`. */
export function controlWidthClass(width: ControlWidth): Record<string, boolean> {
  return {
    'ds-control-width--hug': width === 'hug',
    'ds-control-width--fill': width === 'fill',
  };
}
