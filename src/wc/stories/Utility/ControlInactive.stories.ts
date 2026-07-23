import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import './utility-demo.css';

const meta: Meta = {
  title: 'Utility/ControlInactive',
  parameters: {
    docs: {
      description: {
        component:
          'Shared inactive visual (`src/wc/utils/control-inactive.css`). ' +
          'Apply `.ds-control-inactive` when `isInactive` is true — 50% opacity, no pointer events. ' +
          'See AGENTS.md — Control inactive.',
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
        <h2 class="util-demo-h2">Active vs inactive</h2>
        <p class="util-demo-sub">
          Same control chrome; inactive adds <code class="util-demo-code">.ds-control-inactive</code>
          (<code class="util-demo-code">opacity: 0.5</code>).
        </p>
        <div class="util-demo-row">
          <button type="button" class="util-demo-control ds-interaction-fill ds-focus-ring-inset">
            <span class="ds-interaction-fill__content">Active</span>
          </button>
          <button
            type="button"
            class="util-demo-control ds-control-inactive"
            disabled
            aria-disabled="true"
          >
            Inactive
          </button>
        </div>
      </div>
    </div>
  `,
};
