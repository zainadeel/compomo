import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-disclosure.js';
import '../../../../dist/components/ds-switch.js';
import '../../../../dist/components/ds-text.js';

const meta: Meta = {
  title: 'Layout/Disclosure',
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text' },
    size: { control: 'inline-radio', options: ['sm', 'md'] },
    open: { control: 'boolean' },
    isInactive: { control: 'boolean' },
  },
  args: {
    label: 'View JSON snapshot',
    size: 'md',
    open: false,
    isInactive: false,
  },
};

export default meta;
type Story = StoryObj;

/** The owner supplies the surface; Disclosure brings only the trigger and the reveal. */
const card = (content: unknown) => html`
  <section
    style="box-sizing:border-box;width:min(100%, var(--dimension-card-width-md));padding:var(--dimension-space-200);border-radius:var(--dimension-radius-050);background:var(--color-background-primary);box-shadow:var(--effect-shadow-elevated-sm);"
  >
    ${content}
  </section>
`;

const snapshot = html`
  <pre
    style="box-sizing:border-box;margin:0;max-height:var(--dimension-card-height-xs);overflow:auto;padding:var(--dimension-space-100);border:var(--dimension-stroke-width-012) solid var(--color-border-tertiary);border-radius:var(--dimension-radius-012);background:var(--color-background-secondary);color:var(--color-foreground-secondary);font:var(--typography-weight-regular) var(--typography-fontsize-md) / var(--typography-lineheight-md) var(--typography-font-family-code, monospace);white-space:pre-wrap;"
  >
{
  "speed": 0,
  "frame": 0,
  "minPixelRatio": 1,
  "opacity": 0.09
}</pre
  >
`;

export const Playground: Story = {
  render: args =>
    card(html`
      <ds-disclosure
        label=${args['label'] ?? ''}
        size=${args['size'] ?? 'md'}
        ?open=${args['open']}
        ?is-inactive=${args['isInactive']}
      >
        ${snapshot}
      </ds-disclosure>
    `),
};

/** Optional detail at the end of a tool card, as in the lab's Prototype tools. */
export const InCard: Story = {
  render: () =>
    card(html`
      <div style="display:grid;gap:var(--dimension-space-200);">
        <ds-text as="h3" variant="text-title-small">Paper tuner</ds-text>
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <ds-text as="span" variant="text-body-medium">Animate</ds-text>
          <ds-switch checked aria-label="Animate"></ds-switch>
        </div>
        <ds-disclosure label="View JSON snapshot" open>${snapshot}</ds-disclosure>
      </div>
    `),
};

/** headingLevel wraps the trigger in a heading when the label titles a section. */
export const AsSectionHeading: Story = {
  render: () =>
    card(html`
      <ds-disclosure label="Advanced options" heading-level="3">
        <ds-text as="p" variant="text-body-small" color="secondary" wrap="wrap">
          Options that most fleets leave at their defaults.
        </ds-text>
      </ds-disclosure>
    `),
};

export const Inactive: Story = {
  render: () =>
    card(html` <ds-disclosure label="View JSON snapshot" is-inactive>${snapshot}</ds-disclosure> `),
};
