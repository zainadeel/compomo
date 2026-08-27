export type RenderedTestOwner =
  | 'accessibility'
  | 'controlled-behavior'
  | 'forms'
  | 'interaction'
  | 'layout-geometry'
  | 'motion-lifecycle'
  | 'responsive-shell';

/**
 * Specs repeated in Firefox and WebKit because they own engine-sensitive
 * browser contracts. Chromium runs every rendered spec, including these.
 */
export const crossBrowserContractSpecs = [
  'accessibility-overlays.spec.ts',
  'agent-conversations.spec.ts',
  'banner.spec.ts',
  'bar-nav-overflow.spec.ts',
  'forms.spec.ts',
  'reduced-motion.spec.ts',
  'scroll-overlay.spec.ts',
  'selects.spec.ts',
  'shell-managed.spec.ts',
  'shell-mobile.spec.ts',
  'table.spec.ts',
  'table-virtual.spec.ts',
  'toast.spec.ts',
  'tooltip.spec.ts',
] as const;

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
