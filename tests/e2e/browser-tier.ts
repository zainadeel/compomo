export type RenderedTestOwner =
  | 'accessibility'
  | 'controlled-behavior'
  | 'forms'
  | 'interaction'
  | 'layout-geometry'
  | 'motion-lifecycle'
  | 'responsive-shell';

/**
 * Marks a rendered assertion as engine-neutral after ownership review.
 * Firefox and WebKit projects exclude this tag; Chromium remains authoritative.
 */
export function chromiumOnly(owner: RenderedTestOwner, reason: string) {
  if (!reason.trim()) throw new Error('Chromium-only tests require a browser-tier reason.');
  return {
    tag: '@chromium-only',
    annotation: [
      { type: 'test-owner', description: owner },
      { type: 'browser-tier', description: reason },
    ],
  };
}
