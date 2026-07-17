import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-switch.js';
import '../../../../dist/components/ds-text.js';

const SIZES = ['md', 'sm', 'xs'] as const;
const STACK =
  'display:flex;flex-direction:column;align-items:flex-start;gap:var(--dimension-space-200);';
const ROW =
  'display:flex;align-items:center;justify-content:space-between;gap:var(--dimension-space-300);min-width:var(--dimension-panel-width-sm);';
const PAIR =
  'display:flex;align-items:center;gap:var(--dimension-space-200);';

const meta: Meta = {
  title: 'Form/Switch',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A compact, form-associated on/off control. Every switch requires an accessible name via a label, aria-label, or aria-labelledby.',
      },
    },
  },
  argTypes: {
    checked: { control: 'boolean' },
    size: { control: 'select', options: [...SIZES] },
    readOnly: { control: 'boolean' },
    isInactive: { control: 'boolean' },
  },
  args: { checked: false, size: 'md', readOnly: false, isInactive: false },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  render: args => html`
    <ds-switch
      ?checked=${args['checked']}
      size=${args['size']}
      ?read-only=${args['readOnly']}
      ?is-inactive=${args['isInactive']}
      aria-label="Playground switch"
    ></ds-switch>
  `,
};

export const Sizes: Story = {
  parameters: { controls: { exclude: ['size', 'checked', 'readOnly', 'isInactive'] } },
  render: () => html`
    <div style=${STACK}>
      ${SIZES.map(size => html`
        <div style=${ROW}>
          <ds-text as="span" variant="text-body-medium" color="secondary">
            ${size} · ${size === 'md' ? '32×20' : size === 'sm' ? '24×16' : '20×12'}px
          </ds-text>
          <div style=${PAIR}>
            <ds-switch size=${size} aria-label="${size} off"></ds-switch>
            <ds-switch size=${size} checked aria-label="${size} on"></ds-switch>
          </div>
        </div>
      `)}
    </div>
  `,
};

export const States: Story = {
  parameters: { controls: { exclude: ['checked', 'readOnly', 'isInactive'] } },
  render: args => html`
    <div style=${STACK}>
      ${[
        ['Off', false, false, false],
        ['On', true, false, false],
        ['Read-only off', false, true, false],
        ['Read-only on', true, true, false],
        ['Inactive off', false, false, true],
        ['Inactive on', true, false, true],
      ].map(([label, checked, readOnly, inactive]) => html`
        <div style=${ROW}>
          <ds-text as="span" variant="text-body-medium" color="secondary">${label}</ds-text>
          <ds-switch
            size=${args['size']}
            ?checked=${checked}
            ?read-only=${readOnly}
            ?is-inactive=${inactive}
            aria-label=${String(label)}
          ></ds-switch>
        </div>
      `)}
    </div>
  `,
};

export const Labeling: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style=${STACK}>
      <div style=${ROW}>
        <label for="notifications-switch">
          <ds-text as="span" variant="text-body-medium">Notifications · native label</ds-text>
        </label>
        <ds-switch id="notifications-switch"></ds-switch>
      </div>
      <div style=${ROW}>
        <ds-text id="autosave-label" as="span" variant="text-body-medium">
          Auto-save · aria-labelledby
        </ds-text>
        <ds-switch checked aria-labelledby="autosave-label"></ds-switch>
      </div>
    </div>
  `,
};

export const InContext: Story = {
  name: 'In Context',
  render: args => html`
    <div style=${STACK}>
      <div
        style="
          ${ROW}
          min-height:var(--dimension-size-400);
          padding:0 var(--dimension-space-075);
          border:var(--dimension-stroke-width-012) solid var(--color-border-tertiary);
          border-radius:var(--dimension-radius-025);
        "
      >
        <ds-text id="menu-setting-label" as="span" variant="text-body-medium" color="secondary">
          Menu setting
        </ds-text>
        <ds-switch
          size="md"
          ?checked=${args['checked']}
          ?read-only=${args['readOnly']}
          ?is-inactive=${args['isInactive']}
          aria-labelledby="menu-setting-label"
        ></ds-switch>
      </div>
      <div style=${ROW}>
        <ds-text id="form-preference-label" as="span" variant="text-body-medium">
          Form preference
        </ds-text>
        <ds-switch
          name="preference"
          size=${args['size']}
          ?checked=${args['checked']}
          ?read-only=${args['readOnly']}
          ?is-inactive=${args['isInactive']}
          aria-labelledby="form-preference-label"
        ></ds-switch>
      </div>
    </div>
  `,
};

export const FocusRing: Story = {
  name: 'Outset Focus Ring',
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style=${STACK}>
      <ds-text as="p" variant="text-body-medium" color="secondary">
        The shared outset ring is forced visible below for visual review. Keyboard Tab focus uses the same ring.
      </ds-text>
      <ds-switch
        class="ds-focus-ring--visible"
        size="md"
        aria-label="Focused switch"
      ></ds-switch>
    </div>
  `,
};
