import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-tag.js';
import '../../../../dist/components/ds-icon.js';

const INTENTS   = ['neutral', 'brand', 'ai', 'negative', 'warning', 'caution', 'positive'];
const CONTRASTS = ['strong', 'bold', 'medium', 'faint'];
const SIZES     = ['md', 'sm', 'xs'] as const;

const meta: Meta = {
  title: 'Primitives/Tag',
  tags: ['autodocs'],
  argTypes: {
    label:    { control: 'text' },
    icon:     { control: 'text' },
    intent:   { control: 'select', options: INTENTS },
    contrast: { control: 'select', options: CONTRASTS },
    size:     { control: 'select', options: [...SIZES] },
    rounded:  { control: 'boolean' },
    maxWidth: { control: 'text' },
    interactive: { control: 'boolean' },
    expanded: { control: 'boolean' },
    ariaControls: { control: 'text' },
    isInactive: { control: 'boolean' },
  },
  args: {
    label:    'Tag',
    icon:     '',
    intent:   'neutral',
    contrast: 'faint',
    size:     'md',
    rounded:  false,
    maxWidth: '',
    interactive: false,
    expanded: false,
    ariaControls: '',
    isInactive: false,
  },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  render: args => html`
    <ds-tag
      label=${args['label']}
      icon=${args['icon'] || undefined}
      intent=${args['intent']}
      contrast=${args['contrast']}
      size=${args['size']}
      max-width=${args['maxWidth'] || undefined}
      ?rounded=${args['rounded']}
      ?interactive=${args['interactive']}
      ?expanded=${args['expanded']}
      aria-controls=${args['ariaControls'] || undefined}
      ?is-inactive=${args['isInactive']}
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
    <div style="display: flex; gap: var(--dimension-space-100); flex-wrap: wrap; align-items: center">
      <ds-tag label="Default" intent="neutral" contrast="faint"></ds-tag>
      <ds-tag label="Rounded" intent="brand" contrast="faint" rounded></ds-tag>
    </div>
  `,
};

/** Icon size matches tag size (md/sm/xs → iconography 20/16/12). */
export const WithIcon: Story = {
  render: () => html`
    <div style="display: flex; gap: var(--dimension-space-100); flex-wrap: wrap; align-items: center">
      ${SIZES.map(size => html`
        <ds-tag
          label="Fleet"
          icon="VehicleTruck"
          intent="brand"
          contrast="faint"
          size=${size}
          ?rounded=${size === 'md'}
        ></ds-tag>
      `)}
    </div>
  `,
};

export const InteractiveMenuTrigger: Story = {
  name: 'Interactive menu trigger',
  render: () => html`
    <div>
      <div style="display: flex; gap: var(--dimension-space-100); flex-wrap: wrap; align-items: center">
        <ds-tag
          label="Vehicle status"
          icon="Filters"
          interactive
          aria-controls="vehicle-status-menu"
        ></ds-tag>
        <ds-tag
          label="Expanded"
          icon="Filters"
          interactive
          expanded
          aria-controls="expanded-menu"
        ></ds-tag>
        <ds-tag
          label="Unavailable"
          interactive
          is-inactive
          aria-controls="unavailable-menu"
        ></ds-tag>
      </div>
      <div id="vehicle-status-menu" hidden></div>
      <div id="expanded-menu" hidden></div>
      <div id="unavailable-menu" hidden></div>
    </div>
  `,
};
