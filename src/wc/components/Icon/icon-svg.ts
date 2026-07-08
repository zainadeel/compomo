/**
 * Glyph markup validation + Trusted-Types-safe parsing for ds-icon.
 *
 * Glyphs normally come from the trusted @ds-mo/icons build pipeline, but
 * `registerIcons` accepts arbitrary app-provided strings and injection is a
 * sink — so every glyph is validated at the render boundary. Injection uses
 * parsed DOM nodes (never innerHTML), which keeps ds-icon working under a
 * strict CSP with `require-trusted-types-for 'script'`.
 */

/** Structural view of an element so the walk is unit-testable without a DOM. */
export interface IconSvgElementLike {
  localName: string;
  getAttributeNames(): string[];
  getAttribute(name: string): string | null;
  children: ArrayLike<IconSvgElementLike>;
}

/** Elements that can execute or embed foreign content — never valid in a glyph. */
const FORBIDDEN_ELEMENTS = new Set([
  'script',
  'foreignobject',
  'iframe',
  'object',
  'embed',
  'animation', // SVG 1.2 external-content element (distinct from animate/animateTransform)
]);

function isValidIconSvgElement(el: IconSvgElementLike): boolean {
  if (FORBIDDEN_ELEMENTS.has(el.localName.toLowerCase())) return false;

  for (const attr of el.getAttributeNames()) {
    const lower = attr.toLowerCase();
    // Event handler attributes (onclick, onload, …) — any casing.
    if (lower.startsWith('on')) return false;
    // References must stay internal (#gradient-id); rejects javascript:, data:,
    // and external URLs on <use>, <a>, <image>, …
    if (lower === 'href' || lower === 'xlink:href') {
      const value = el.getAttribute(attr) ?? '';
      if (!value.startsWith('#')) return false;
    }
  }

  for (let i = 0; i < el.children.length; i++) {
    if (!isValidIconSvgElement(el.children[i])) return false;
  }

  return true;
}

/** True when `root` is an `<svg>` whose whole tree passes validation. */
export function isValidIconSvgRoot(root: IconSvgElementLike | null): boolean {
  return root != null && root.localName === 'svg' && isValidIconSvgElement(root);
}

/**
 * Parse + validate glyph markup. Returns a detached `<svg>` element ready to
 * append (appending adopts it into the document), or `null` when the markup
 * is not well-formed XML, not rooted at `<svg>`, or fails validation —
 * ds-icon renders an empty fixed-size box in that case.
 */
export function parseIconSvg(svg: string): SVGElement | null {
  if (typeof DOMParser === 'undefined') return null;

  const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
  // Malformed XML yields a parsererror document (root or nested, per browser).
  if (doc.querySelector('parsererror')) return null;

  const root = doc.documentElement as unknown as IconSvgElementLike;
  if (!isValidIconSvgRoot(root)) return null;

  return doc.documentElement as unknown as SVGElement;
}
