import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-tag.js';
import '../../../../dist/components/ds-icon.js';

const INTENTS    = ['neutral', 'brand', 'ai', 'negative', 'warning', 'caution', 'positive'];
const CONTRASTS  = ['strong', 'bold', 'medium', 'faint'];
const ELEVATIONS = ['none', 'flat', 'elevated'];
const SIZES      = ['md', 'sm', 'xs'];

const meta: Meta = {
  title: 'Primitives/Tag',
  tags: ['autodocs'],
  argTypes: {
    label:     { control: 'text' },
    intent:    { control: 'select', options: INTENTS },
    contrast:  { control: 'select', options: CONTRASTS },
    elevation: { control: 'select', options: ELEVATIONS },
    size:      { control: 'select', options: SIZES },
    rounded:   { control: 'boolean' },
    maxWidth:  { control: 'text' },
  },
  args: {
    label:     'Tag',
    intent:    'neutral',
    contrast:  'faint',
    elevation: 'none',
    size:      'md',
    rounded:   false,
    maxWidth:  '',
  },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  render: args => html`
    <ds-tag
      label=${args['label']}
      intent=${args['intent']}
      contrast=${args['contrast']}
      elevation=${args['elevation']}
      size=${args['size']}
      max-width=${args['maxWidth'] || undefined}
      ?rounded=${args['rounded']}
    ></ds-tag>
  `,
};

export const IntentMatrix: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: var(--dimension-space-100)">
      ${CONTRASTS.map(contrast => html`
        <div>
          <div style="font-size: var(--typography-fontsize-xs); font-family: var(--typography-fontfamily-mono); color: var(--color-foreground-tertiary); margin-bottom: var(--dimension-space-050)">${contrast}</div>
          <div style="display: flex; gap: var(--dimension-space-100); flex-wrap: wrap">
            ${INTENTS.map(intent => html`
              <ds-tag label=${intent} intent=${intent} contrast=${contrast}></ds-tag>
            `)}
          </div>
        </div>
      `)}
    </div>
  `,
};

export const Elevations: Story = {
  render: () => html`
    <div style="display: flex; gap: var(--dimension-space-200); align-items: center; flex-wrap: wrap">
      ${ELEVATIONS.map(elevation => html`
        <div style="display: flex; flex-direction: column; align-items: center; gap: var(--dimension-space-075)">
          <ds-tag label=${elevation} intent="brand" contrast="faint" elevation=${elevation}></ds-tag>
          <span style="font-size: var(--typography-fontsize-xs); font-family: var(--typography-fontfamily-mono); color: var(--color-foreground-tertiary)">${elevation}</span>
        </div>
      `)}
    </div>
  `,
};

export const Sizes: Story = {
  render: () => html`
    <div style="display: flex; gap: var(--dimension-space-150); align-items: center">
      ${SIZES.map(size => html`
        <div style="display: flex; flex-direction: column; align-items: center; gap: var(--dimension-space-075)">
          <ds-tag label=${size} intent="brand" contrast="faint" size=${size}></ds-tag>
          <span style="font-size: var(--typography-fontsize-xs); font-family: var(--typography-fontfamily-mono); color: var(--color-foreground-tertiary)">${size}</span>
        </div>
      `)}
    </div>
  `,
};

export const Rounded: Story = {
  render: () => html`
    <div style="display: flex; gap: var(--dimension-space-100); flex-wrap: wrap">
      <ds-tag label="Default" intent="neutral" contrast="faint"></ds-tag>
      <ds-tag label="Rounded" intent="brand" contrast="faint" rounded></ds-tag>
    </div>
  `,
};

export const WithIcon: Story = {
  render: () => html`
    <ds-tag label="Fleet" intent="brand" contrast="faint" rounded>
      <ds-icon slot="icon" name="Truck" size="sm" color="inherit"></ds-icon>
    </ds-tag>
  `,
};
