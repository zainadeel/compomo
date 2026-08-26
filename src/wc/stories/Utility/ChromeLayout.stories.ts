import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-button-unfilled.js';
import '../../../../dist/components/ds-text.js';
import './utility-demo.css';

const meta: Meta = {
  title: 'Utility/ChromeLayout',
  parameters: {
    docs: {
      description: {
        component:
          'Spacing-only structural chrome utility. `ds-chrome-space--sm|md|lg` sets matching padding and gap recipes (4, 8, or 16px); `ds-chrome-row|column|grid` selects the layout. The utility never owns width or height.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

const DENSITIES = [
  { size: 'sm', value: '4px' },
  { size: 'md', value: '8px' },
  { size: 'lg', value: '16px' },
] as const;

export const SpacingAndAxis: Story = {
  render: () => html`
    <div class="util-demo-page">
      ${DENSITIES.map(
        ({ size, value }) => html`
          <section class="util-demo-section">
            <h2 class="util-demo-h2">${size} · ${value} padding / ${value} gap</h2>
            <div
              class="ds-chrome-row ds-chrome-space--${size}"
              style="width:100%;border:var(--dimension-stroke-width-012) solid var(--color-border-tertiary);background:var(--color-background-secondary);"
            >
              <ds-text as="span" variant="text-body-medium" emphasis>Row chrome</ds-text>
              <ds-button-unfilled
                variant="icon"
                icon="Ellipses"
                aria-label="${size} row options"
                .hasBorder=${false}
              ></ds-button-unfilled>
            </div>
            <div
              class="ds-chrome-column ds-chrome-space--${size}"
              style="width:100%;border:var(--dimension-stroke-width-012) solid var(--color-border-tertiary);background:var(--color-background-secondary);"
            >
              <ds-text as="span" variant="text-body-medium" emphasis>Column chrome</ds-text>
              <ds-text as="span" variant="text-body-small" color="secondary">
                Inner groups may own their own spacing independently.
              </ds-text>
            </div>
          </section>
        `
      )}
      <section class="util-demo-section">
        <h2 class="util-demo-h2">Grid · symmetric chrome lanes</h2>
        <div
          class="ds-chrome-grid ds-chrome-space--md"
          style="width:100%;grid-template-columns:1fr auto 1fr;border:var(--dimension-stroke-width-012) solid var(--color-border-tertiary);background:var(--color-background-secondary);"
        >
          <ds-text as="span" variant="text-body-small">Leading</ds-text>
          <ds-text as="span" variant="text-body-medium" emphasis>Centered</ds-text>
          <ds-text as="span" variant="text-body-small" style="justify-self:end;">Trailing</ds-text>
        </div>
      </section>
    </div>
  `,
};
