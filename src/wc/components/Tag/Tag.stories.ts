import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { useArgs } from 'storybook/preview-api';
import '../../../../dist/components/ds-tag.js';
import '../../../../dist/components/ds-icon.js';
import '../../../../dist/components/ds-menu.js';

const INTENTS   = ['neutral', 'brand', 'ai', 'negative', 'warning', 'caution', 'positive'];
const CONTRASTS = ['strong', 'bold', 'medium', 'faint'];
const SIZES     = ['md', 'sm', 'xs'] as const;
const STATUS_ITEMS = [
  { label: 'All vehicles', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Needs attention', value: 'attention' },
  { label: 'Out of service', value: 'out-of-service' },
];

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
  args: {
    expanded: false,
    initialFocusVisible: false,
    selectedStatus: 'all',
  },
  render: args => {
    const [, updateArgs] = useArgs();
    const selectedStatus = String(args['selectedStatus'] ?? 'all');
    const selectedItem = STATUS_ITEMS.find(item => item.value === selectedStatus) ?? STATUS_ITEMS[0];
    const items = STATUS_ITEMS.map(item => ({
      ...item,
      isSelected: item.value === selectedStatus,
    }));
    const restoreTriggerFocus = () => {
      document
        .getElementById('vehicle-status-tag')
        ?.querySelector<HTMLButtonElement>('button')
        ?.focus();
    };

    return html`
      <div style="min-height: 240px; padding: var(--dimension-space-100)">
        <ds-tag
          id="vehicle-status-tag"
          label=${`Status · ${selectedItem.label}`}
          icon="Filters"
          interactive
          ?expanded=${Boolean(args['expanded'])}
          aria-controls="vehicle-status-menu"
          @dsClick=${(event: CustomEvent<MouseEvent>) => updateArgs({
            expanded: !args['expanded'],
            initialFocusVisible: event.detail.detail === 0,
          })}
        ></ds-tag>
        <ds-menu
          id="vehicle-status-menu"
          anchor-id="vehicle-status-tag"
          menu-label="Vehicle status"
          side="bottom"
          align="start"
          ?initial-focus-visible=${Boolean(args['initialFocusVisible'])}
          ?open=${Boolean(args['expanded'])}
          .items=${items}
          @dsClose=${() => updateArgs({ expanded: false })}
          @dsSelect=${(event: CustomEvent<{ value?: string }>) => {
            updateArgs({
              expanded: false,
              selectedStatus: event.detail.value ?? selectedStatus,
            });
            requestAnimationFrame(restoreTriggerFocus);
          }}
        ></ds-menu>
      </div>
    `;
  },
};
