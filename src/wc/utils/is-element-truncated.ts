/** Subpixel rounding can make overflow look equal at 0–1px; ignore that noise. */
const TRUNCATION_EPSILON_PX = 1;

/**
 * Whether a laid-out element is visually truncated.
 * Prefers `ds-text`'s inner semantic node when present so host flex layout
 * does not hide horizontal or line-clamp overflow.
 */
export function isElementTruncated(element: HTMLElement): boolean {
  const target = element.querySelector<HTMLElement>('.ds-text__element') ?? element;
  return (
    target.scrollWidth - target.clientWidth > TRUNCATION_EPSILON_PX ||
    target.scrollHeight - target.clientHeight > TRUNCATION_EPSILON_PX
  );
}
