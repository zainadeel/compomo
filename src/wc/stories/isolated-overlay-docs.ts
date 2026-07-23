/**
 * Storybook's inline docs canvas applies a transform for zooming. That
 * transform changes the containing block for viewport-fixed overlays, so an
 * otherwise-correct popup can be offset from its trigger. Render affected
 * stories in an iframe to give them the same coordinate space as Canvas.
 */
export const isolatedOverlayDocs = (iframeHeight: string) => ({
  story: {
    inline: false,
    iframeHeight,
  },
});
