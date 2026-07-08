/** CSS custom property for scroll-edge fade depth (dimension token or length). */
export const SCROLL_EDGE_FADE_SIZE_VAR = '--ds-scroll-edge-fade-size';

export const SCROLL_EDGE_FADE_DEFAULT_SIZE = 'var(--dimension-size-600)';

export type ScrollEdgeFadeEdge = 'top' | 'bottom' | 'left' | 'right';

export type ScrollEdgeFadeSizeToken =
  | 'size-000'
  | 'size-050'
  | 'size-075'
  | 'size-100'
  | 'size-150'
  | 'size-200'
  | 'size-250'
  | 'size-300'
  | 'size-400'
  | 'size-500'
  | 'size-600'
  | 'size-800';

export type ScrollEdgeFadeSize = ScrollEdgeFadeSizeToken | (string & {});

const SIZE_VALUE: Record<ScrollEdgeFadeSizeToken, string> = {
  'size-000': 'var(--dimension-size-000)',
  'size-050': 'var(--dimension-size-050)',
  'size-075': 'var(--dimension-size-075)',
  'size-100': 'var(--dimension-size-100)',
  'size-150': 'var(--dimension-size-150)',
  'size-200': 'var(--dimension-size-200)',
  'size-250': 'var(--dimension-size-250)',
  'size-300': 'var(--dimension-size-300)',
  'size-400': 'var(--dimension-size-400)',
  'size-500': 'var(--dimension-size-500)',
  'size-600': 'var(--dimension-size-600)',
  'size-800': 'var(--dimension-size-800)',
};

const SIZE_REF = `var(${SCROLL_EDGE_FADE_SIZE_VAR}, ${SCROLL_EDGE_FADE_DEFAULT_SIZE})`;

export interface ScrollEdgeFadeOptions {
  /** One or more edges to fade. */
  edges: ScrollEdgeFadeEdge | ScrollEdgeFadeEdge[];
  /**
   * When true, or when every listed edge is at its scroll limit, removes the mask.
   * Pass a per-edge map to hide only the edges that are flush (panel-nav bottom fade).
   */
  atEnd?: boolean | Partial<Record<ScrollEdgeFadeEdge, boolean>>;
  /** Force the mask off regardless of scroll position (`ds-fade` `visible={false}`). */
  hidden?: boolean;
}

/** Resolve a dimension size token name or raw CSS length for `--ds-scroll-edge-fade-size`. */
export function resolveScrollEdgeFadeSize(
  size: ScrollEdgeFadeSize = 'size-600',
  height?: string,
): string {
  if (height) return height;
  return Object.prototype.hasOwnProperty.call(SIZE_VALUE, size)
    ? SIZE_VALUE[size as ScrollEdgeFadeSizeToken]
    : size;
}

/** Inline style map setting fade depth on a scroll container. */
export function scrollEdgeFadeSizeStyle(
  size: ScrollEdgeFadeSize = 'size-600',
  height?: string,
): Record<string, string> {
  return {
    [SCROLL_EDGE_FADE_SIZE_VAR]: resolveScrollEdgeFadeSize(size, height),
  };
}

/**
 * Alpha mask for a scroll container edge — content fades to transparent so
 * textured backgrounds (shell gradients, images) show through.
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

/** Inline style map for a masked scroll region (single edge). */
export function scrollEdgeFadeMaskStyle(
  edge: ScrollEdgeFadeEdge,
  size: ScrollEdgeFadeSize = 'size-600',
  height?: string,
): Record<string, string> {
  const mask = scrollEdgeFadeMaskImage(edge);
  return {
    ...scrollEdgeFadeSizeStyle(size, height),
    WebkitMaskImage: mask,
    maskImage: mask,
    WebkitMaskSize: '100% 100%',
    maskSize: '100% 100%',
  };
}

/** Class map for `scroll-edge-fade` modifiers — pair with `scroll-edge-fade.css`. */
export function scrollEdgeFadeClassMap(opts: ScrollEdgeFadeOptions): Record<string, boolean> {
  const edges = Array.isArray(opts.edges) ? opts.edges : [opts.edges];
  const classes: Record<string, boolean> = {
    'scroll-edge-fade': true,
    'scroll-edge-fade--hidden': opts.hidden === true,
  };

  for (const edge of edges) {
    classes[`scroll-edge-fade--${edge}`] = true;
  }

  const { atEnd } = opts;
  if (atEnd === true) {
    classes['scroll-edge-fade--at-end'] = true;
  } else if (atEnd && typeof atEnd === 'object') {
    const allAtEnd = edges.every(edge => atEnd[edge]);
    if (allAtEnd) {
      classes['scroll-edge-fade--at-end'] = true;
    }
  }

  return classes;
}

/** Whether a scroll container is flush with the given edge (within `threshold` px). */
export function isScrollAtEdge(
  el: HTMLElement,
  edge: ScrollEdgeFadeEdge,
  threshold = 2,
): boolean {
  switch (edge) {
    case 'top':
      return el.scrollTop <= threshold;
    case 'bottom':
      return el.scrollHeight - el.scrollTop - el.clientHeight <= threshold;
    case 'left':
      return el.scrollLeft <= threshold;
    case 'right':
      return el.scrollWidth - el.scrollLeft - el.clientWidth <= threshold;
  }
}
