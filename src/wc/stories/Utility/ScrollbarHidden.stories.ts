import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import './utility-demo.css';

const meta: Meta = {
  title: 'Utility/ScrollbarHidden',
  parameters: {
    docs: {
      description: {
        component:
          'Shared hidden-scrollbar recipe (`src/wc/utils/scrollbar-hidden.css`). ' +
          'Apply `.ds-scrollbar-hidden` directly to the scrolling element — suppresses ' +
          'native scrollbar chrome while keeping wheel/drag/keyboard scroll working. ' +
          'See AGENTS.md — Hidden scrollbars.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Overview: Story = {
  render: () => html`
    <div class="util-demo-page">
      <div class="util-demo-section">
        <h2 class="util-demo-h2">Default vs hidden scrollbar</h2>
        <p class="util-demo-sub">
          Both lists scroll identically. The second adds
          <code class="util-demo-code">.ds-scrollbar-hidden</code> to suppress the native
          scrollbar track/thumb.
        </p>
        <div class="util-demo-row" style="align-items: flex-start;">
          <div style="height: 120px; width: 160px; overflow-y: auto; border: 1px solid var(--color-border-secondary);">
            ${Array.from({ length: 12 }, (_, i) => html`<div style="padding: 8px;">Row ${i + 1}</div>`)}
          </div>
          <div
            class="ds-scrollbar-hidden"
            style="height: 120px; width: 160px; overflow-y: auto; border: 1px solid var(--color-border-secondary);"
          >
            ${Array.from({ length: 12 }, (_, i) => html`<div style="padding: 8px;">Row ${i + 1}</div>`)}
          </div>
        </div>
      </div>
    </div>
  `,
};
