/** CSS custom property for scroll-edge fade depth (dimension token or length). */
export const SCROLL_EDGE_FADE_SIZE_VAR = '--ds-scroll-edge-fade-size';

export const SCROLL_EDGE_FADE_DEFAULT_SIZE = 'var(--dimension-size-600)';

export type ScrollEdgeFadeEdge = 'top' | 'bottom' | 'left' | 'right';

const SIZE_REF = `var(${SCROLL_EDGE_FADE_SIZE_VAR}, ${SCROLL_EDGE_FADE_DEFAULT_SIZE})`;

/**
 * Alpha mask for a scroll container edge — content fades to transparent so
 * textured backgrounds (gradients, images) show through. Prefer over painted
 * `ds-fade` overlays on non-flat surfaces.
 */
export function scrollEdgeFadeMaskImage(edge: ScrollEdgeFadeEdge): string {
  switch (edge) {
    case 'top':
      return `linear-gradient(to bottom, #000 0, #000 50%, transparent 100%)`;
    case 'bottom':
      return `linear-gradient(to bottom, #000 0, #000 calc(100% - ${SIZE_REF}), transparent 100%)`;
    case 'left':
      return `linear-gradient(to right, #000 0, #000 calc(100% - ${SIZE_REF}), transparent 100%)`;
    case 'right':
      return `linear-gradient(to left, #000 0, #000 calc(100% - ${SIZE_REF}), transparent 100%)`;
  }
}

/** Inline style map for a masked scroll region. */
export function scrollEdgeFadeMaskStyle(edge: ScrollEdgeFadeEdge): Record<string, string> {
  const mask = scrollEdgeFadeMaskImage(edge);
  return {
    [SCROLL_EDGE_FADE_SIZE_VAR]: SCROLL_EDGE_FADE_DEFAULT_SIZE,
    WebkitMaskImage: mask,
    maskImage: mask,
    WebkitMaskSize: '100% 100%',
    maskSize: '100% 100%',
  };
}
