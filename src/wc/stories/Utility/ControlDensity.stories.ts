import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import './utility-demo.css';

const meta: Meta = {
  title: 'Utility/ControlDensity',
  parameters: {
    docs: {
      description: {
        component:
          'Shared md / sm / xs metrics (`src/wc/utils/control-density.css`). ' +
          'Apply `.ds-control--md|sm|xs` to set `--ds-control-*` vars (height, padding, gap, icon, radius). ' +
          'See AGENTS.md — Control density recipes.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

const SIZES = [
  { cls: 'ds-control--md', label: 'md', text: 'text-body-medium' },
  { cls: 'ds-control--sm', label: 'sm', text: 'text-body-small' },
  { cls: 'ds-control--xs', label: 'xs', text: 'text-caption' },
] as const;

export const Overview: Story = {
  render: () => html`
    <div class="util-demo-page">
      <div class="util-demo-section">
        <h2 class="util-demo-h2">Density scale</h2>
        <p class="util-demo-sub">
          Fixed height from <code class="util-demo-code">--ds-control-height</code> + horizontal padding only.
        </p>
        <div class="util-demo-col">
          ${SIZES.map(
            ({ cls, label, text }) => html`
              <div class="util-demo-row">
                <span class="util-demo-label">${label}</span>
                <button
                  type="button"
                  class="util-demo-control ${cls} ds-interaction-fill ds-focus-ring-inset"
                >
                  <span class="ds-interaction-fill__content ${text}">Label</span>
                </button>
                <span class="util-demo-code">.${cls}</span>
              </div>
            `,
          )}
        </div>
      </div>
    </div>
  `,
};
