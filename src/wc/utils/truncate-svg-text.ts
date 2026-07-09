/**
 * Binary-searches the longest prefix of `text` (plus an ellipsis) that fits within `maxWidth`
 * px when rendered by `el`, using the SVG `getComputedTextLength()` API for exact measurement —
 * `text-overflow: ellipsis` doesn't apply to raw SVG `<text>` nodes.
 *
 * Mutates `el.textContent` during measurement; the caller's next render (driven by the
 * returned string going into state) overwrites it with the final value.
 */
export function truncateSvgTextToWidth(el: SVGTextElement, text: string, maxWidth: number): string {
  el.textContent = text;
  if (maxWidth <= 0 || el.getComputedTextLength() <= maxWidth) return text;

  let lo = 0;
  let hi = text.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    el.textContent = `${text.slice(0, mid)}…`;
    if (el.getComputedTextLength() <= maxWidth) {
      lo = mid;
    } else {
      hi = mid - 1;
    }
  }
  return lo > 0 ? `${text.slice(0, lo)}…` : '…';
}
