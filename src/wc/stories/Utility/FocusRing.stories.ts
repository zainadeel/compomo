import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import './utility-demo.css';

const meta: Meta = {
  title: 'Utility/FocusRing',
  parameters: {
    docs: {
      description: {
        component:
          'Shared focus rings (`src/wc/utils/focus-ring.css`). Prefer ' +
          '`.ds-focus-ring-inset` for chrome / borderless controls; `.ds-focus-ring` for an outside ring. ' +
          'Use `.ds-focus-ring--visible` only for keyboard-managed roving focus. ' +
          'See AGENTS.md — Focus states.',
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
        <h2 class="util-demo-h2">Tab to focus</h2>
        <p class="util-demo-sub">
          Inset ring paints on <code class="util-demo-code">::after</code> (pairs with interaction-fill).
          Outside ring uses outline offset.
        </p>
        <div class="util-demo-row">
          <button type="button" class="util-demo-control ds-interaction-fill ds-focus-ring-inset">
            <span class="ds-interaction-fill__content">Inset ring</span>
          </button>
          <button type="button" class="util-demo-control ds-focus-ring">
            Outside ring
          </button>
          <button
            type="button"
            class="util-demo-control ds-interaction-fill ds-focus-ring-inset ds-focus-ring--visible"
          >
            <span class="ds-interaction-fill__content">Forced visible</span>
          </button>
        </div>
      </div>
    </div>
  `,
};
