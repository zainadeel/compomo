import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import './utility-demo.css';

const meta: Meta = {
  title: 'Utility/ScrollEdgeFade',
  parameters: {
    docs: {
      description: {
        component:
          'Scroll-edge alpha mask (`src/wc/utils/scroll-edge-fade.css` + `scroll-edge-fade.ts`). ' +
          'Apply `.scroll-edge-fade` + `.scroll-edge-fade--top|bottom|left|right` on the overflow container. ' +
          'Static fades remain visible by design. Add `.scroll-edge-fade--scroll-aware` to reveal and hide ' +
          'configured edges from native scroll position without JavaScript. No component wrapper — same pattern ' +
          'as interaction-fill / focus-ring. PanelNav intentionally uses the static bottom mode.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

const LINES = Array.from({ length: 16 }, (_, i) => `Scrollable line ${i + 1}`);

export const Overview: Story = {
  render: () => html`
    <div class="util-demo-page">
      <div class="util-demo-section">
        <h2 class="util-demo-h2">Static bottom edge</h2>
        <p class="util-demo-sub">
          PanelNav pattern: the bottom fade intentionally remains present while scrolling.
          Import the util CSS and use <code class="util-demo-code">scrollEdgeFadeClassMap</code> from
          <code class="util-demo-code">@ds-mo/ui/utils</code>.
        </p>
        <div class="util-demo-row">
          <div
            class="util-demo-scroll scroll-edge-fade scroll-edge-fade--bottom"
            role="region"
            aria-label="Static bottom fade example"
            tabindex="0"
          >
            ${LINES.map(line => html`<div>${line}</div>`)}
          </div>
        </div>
      </div>

      <div class="util-demo-section">
        <h2 class="util-demo-h2">Scroll-aware edges</h2>
        <p class="util-demo-sub">
          The bottom fade disappears near the end; after scrolling down, the top fade appears. This is driven
          by the scroll container's CSS timeline, with the configured static fades as the browser fallback.
        </p>
        <div class="util-demo-row">
          <div
            class="util-demo-scroll scroll-edge-fade scroll-edge-fade--top scroll-edge-fade--bottom scroll-edge-fade--scroll-aware"
            role="region"
            aria-label="Scroll-aware fade example"
            tabindex="0"
          >
            ${LINES.map(line => html`<div>${line}</div>`)}
          </div>
        </div>
      </div>
    </div>
  `,
};
