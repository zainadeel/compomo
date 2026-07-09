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
          'Add `.scroll-edge-fade--at-end` when flush with the edge. No component wrapper — same pattern as ' +
          'interaction-fill / focus-ring. Used by PanelNav directly.',
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
        <h2 class="util-demo-h2">Bottom edge fade</h2>
        <p class="util-demo-sub">
          Mask fades content to transparent so the parent surface (or shell gradient) shows through.
          Import the util CSS and use <code class="util-demo-code">scrollEdgeFadeClassMap</code> from
          <code class="util-demo-code">@ds-mo/ui/utils</code>.
        </p>
        <div class="util-demo-row">
          <div class="util-demo-scroll scroll-edge-fade scroll-edge-fade--bottom">
            ${LINES.map(line => html`<div>${line}</div>`)}
          </div>
          <div class="util-demo-scroll">
            ${LINES.map(line => html`<div>${line}</div>`)}
            <p class="util-demo-code" style="margin-top: var(--dimension-space-100)">no fade</p>
          </div>
        </div>
      </div>
    </div>
  `,
};
