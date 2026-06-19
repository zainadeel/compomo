import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-chip.js';
import '../../../../dist/components/ds-icon.js';

const INTENTS    = ['neutral', 'brand', 'ai', 'negative', 'warning', 'caution', 'positive'];
const CONTRASTS  = ['strong', 'bold', 'medium', 'faint'];
const ELEVATIONS = ['none', 'flat', 'elevated'];
const SIZES      = ['md', 'sm', 'xs'];
const BACKGROUNDS = ['', 'faint', 'medium', 'bold', 'strong', 'always-dark'];

const meta: Meta = {
  title: 'Primitives/Chip',
  tags: ['autodocs'],
  argTypes: {
    label:      { control: 'text' },
    intent:     { control: 'select', options: INTENTS },
    contrast:   { control: 'select', options: CONTRASTS },
    elevation:  { control: 'select', options: ELEVATIONS },
    size:       { control: 'select', options: SIZES },
    rounded:    { control: 'boolean' },
    removable:  { control: 'boolean' },
    inactive:   { control: 'boolean' },
    pressed:    { control: 'boolean' },
    background: { control: 'select', options: BACKGROUNDS },
    maxWidth:   { control: 'text' },
  },
  args: {
    label: 'Chip',
    intent: 'neutral',
    contrast: 'faint',
    elevation: 'none',
    size: 'md',
    rounded: true,
    removable: false,
    inactive: false,
    pressed: false,
    background: '',
    maxWidth: '',
  },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  render: args => html`
    <ds-chip
      label=${args['label']}
      intent=${args['intent']}
      contrast=${args['contrast']}
      elevation=${args['elevation']}
      size=${args['size']}
      background=${args['background'] || undefined}
      max-width=${args['maxWidth'] || undefined}
      ?rounded=${args['rounded']}
      ?removable=${args['removable']}
      ?inactive=${args['inactive']}
      ?pressed=${args['pressed']}
    ></ds-chip>
  `,
};

export const Removable: Story = {
  render: () => html`
    <div style="display: flex; gap: var(--dimension-space-100); flex-wrap: wrap">
      ${SIZES.map(size => html`
        <ds-chip label="Removable" intent="neutral" contrast="faint" size=${size} removable rounded></ds-chip>
      `)}
    </div>
  `,
};

export const Pressed: Story = {
  render: () => html`
    <div style="display: flex; gap: var(--dimension-space-100); flex-wrap: wrap">
      <ds-chip label="Default" intent="neutral" contrast="faint" rounded></ds-chip>
      <ds-chip label="Pressed" intent="brand" contrast="faint" rounded pressed></ds-chip>
      <ds-chip label="Inactive" intent="neutral" contrast="faint" rounded inactive></ds-chip>
    </div>
  `,
};

export const WithIcon: Story = {
  render: () => html`
    <ds-chip label="Fleet" intent="brand" contrast="faint" rounded removable>
      <ds-icon slot="icon" name="Truck" size="sm" color="inherit"></ds-icon>
    </ds-chip>
  `,
};
