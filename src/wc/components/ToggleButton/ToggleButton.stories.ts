import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-toggle-button.js';
import '../../../../dist/components/ds-icon.js';

const meta: Meta = {
  title: 'Actions/ToggleButton',
  tags: ['autodocs'],
  argTypes: {
    elevation: { control: 'select', options: ['none', 'flat', 'elevated', 'floating'] },
    label:     { control: 'text' },
    icon:      { control: 'text' },
    size:      { control: 'select', options: ['xs', 'sm', 'md'] },
    rounded:   { control: 'boolean' },
    background:{ control: 'select', options: ['faint', 'medium', 'bold', 'strong', 'always-dark'] },
    pressed:   { control: 'boolean' },
    inactive:  { control: 'boolean' },
  },
  args: {
    elevation: 'elevated',
    label: 'Toggle',
    size: 'md',
    rounded: false,
    pressed: false,
    inactive: false,
  },
};

export default meta;
type Story = StoryObj;

const ROW = 'display: flex; gap: 8px; align-items: center; flex-wrap: wrap;';
const COL = 'display: flex; flex-direction: column; gap: 12px; align-items: flex-start;';
const LBL = 'font-size: 10px; font-family: monospace; color: var(--color-foreground-tertiary, #888); min-width: 80px; flex-shrink: 0;';

export const Playground: Story = {
  render: args => html`
    <ds-toggle-button
      elevation=${args['elevation'] ?? 'elevated'}
      label=${args['label'] ?? ''}
      icon=${args['icon'] ?? ''}
      size=${args['size'] ?? 'md'}
      ?rounded=${args['rounded']}
      background=${args['background'] ?? ''}
      ?pressed=${args['pressed']}
      ?inactive=${args['inactive']}
    ></ds-toggle-button>
  `,
};

export const ElevationLevels: Story = {
  render: () => html`
    <div style="${COL}">
      <div style="${ROW}">
        <span style="${LBL}">elevated</span>
        <ds-toggle-button elevation="elevated" label="Label"></ds-toggle-button>
        <ds-toggle-button elevation="elevated" label="Pressed" pressed></ds-toggle-button>
      </div>
      <div style="${ROW}">
        <span style="${LBL}">flat</span>
        <ds-toggle-button elevation="flat" label="Label"></ds-toggle-button>
        <ds-toggle-button elevation="flat" label="Pressed" pressed></ds-toggle-button>
      </div>
      <div style="${ROW}">
        <span style="${LBL}">none</span>
        <ds-toggle-button elevation="none" label="Label"></ds-toggle-button>
        <ds-toggle-button elevation="none" label="Pressed" pressed></ds-toggle-button>
      </div>
      <div style="${ROW}">
        <span style="${LBL}">floating</span>
        <ds-toggle-button elevation="floating" label="Label"></ds-toggle-button>
        <ds-toggle-button elevation="floating" label="Pressed" pressed></ds-toggle-button>
      </div>
    </div>
  `,
};

export const PressedState: Story = {
  render: () => html`
    <div style="${COL}">
      <div style="${ROW}">
        <span style="${LBL}">unpressed</span>
        <ds-toggle-button elevation="elevated" label="Label only"></ds-toggle-button>
        <ds-toggle-button elevation="elevated" icon="GridView" aria-label="Grid view"></ds-toggle-button>
        <ds-toggle-button elevation="elevated" icon="GridView" label="With icon"></ds-toggle-button>
      </div>
      <div style="${ROW}">
        <span style="${LBL}">pressed</span>
        <ds-toggle-button elevation="elevated" label="Label only" pressed></ds-toggle-button>
        <ds-toggle-button elevation="elevated" icon="GridView" aria-label="Grid view" pressed></ds-toggle-button>
        <ds-toggle-button elevation="elevated" icon="GridView" label="With icon" pressed></ds-toggle-button>
      </div>
    </div>
  `,
};

export const Sizes: Story = {
  render: () => html`
    <div style="${COL}">
      ${(['md', 'sm', 'xs'] as const).map(size => html`
        <div style="${ROW}">
          <span style="${LBL}">${size}</span>
          <ds-toggle-button elevation="elevated" size=${size} label="Label"></ds-toggle-button>
          <ds-toggle-button elevation="elevated" size=${size} icon="GridView" aria-label="Grid view"></ds-toggle-button>
          <ds-toggle-button elevation="elevated" size=${size} icon="GridView" label="Icon + label"></ds-toggle-button>
        </div>
      `)}
    </div>
  `,
};

export const Rounded: Story = {
  render: () => html`
    <div style="${ROW}">
      <ds-toggle-button elevation="elevated" label="Rounded" rounded></ds-toggle-button>
      <ds-toggle-button elevation="elevated" label="Pressed" rounded pressed></ds-toggle-button>
      <ds-toggle-button elevation="elevated" icon="GridView" aria-label="Rounded icon" rounded></ds-toggle-button>
      <ds-toggle-button elevation="flat" label="Flat rounded" rounded></ds-toggle-button>
      <ds-toggle-button elevation="none" label="Ghost rounded" rounded></ds-toggle-button>
    </div>
  `,
};

export const Inactive: Story = {
  render: () => html`
    <div style="${ROW}">
      <ds-toggle-button elevation="elevated" label="Inactive" inactive></ds-toggle-button>
      <ds-toggle-button elevation="flat" label="Inactive flat" inactive></ds-toggle-button>
      <ds-toggle-button elevation="none" label="Inactive ghost" inactive></ds-toggle-button>
    </div>
  `,
};
