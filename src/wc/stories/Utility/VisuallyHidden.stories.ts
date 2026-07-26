import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import './utility-demo.css';

const meta: Meta = {
  title: 'Utility/VisuallyHidden',
  parameters: {
    docs: {
      description: {
        component:
          'Shared accessible-only text recipe (`src/wc/utils/visually-hidden.css`). ' +
          'Apply `.ds-visually-hidden` alongside the element\'s own semantic/hook class — ' +
          'clips the box to 1px while keeping it in the accessibility tree. ' +
          'See AGENTS.md — Visually hidden text.',
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
        <h2 class="util-demo-h2">Visible vs visually hidden</h2>
        <p class="util-demo-sub">
          Both spans render the same text. The second is clipped with
          <code class="util-demo-code">.ds-visually-hidden</code> — invisible on screen, present
          for screen readers (inspect the accessibility tree to confirm).
        </p>
        <div class="util-demo-row">
          <span class="util-demo-control">Supplemental label</span>
          <span class="util-demo-control">
            (hidden text follows: <span class="ds-visually-hidden">Supplemental label</span>)
          </span>
        </div>
      </div>
    </div>
  `,
};
