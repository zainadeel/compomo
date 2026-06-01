import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { ref } from 'lit/directives/ref.js';
import '../../../../dist/components/ds-toggle-button.js';
import '../../../../dist/components/ds-toggle-button-group.js';
import '../../../../dist/components/ds-icon.js';

const meta: Meta = {
  title: 'Actions/ToggleButtonGroup',
  tags: ['autodocs'],
  argTypes: {
    elevation: { control: 'select', options: ['none', 'flat', 'elevated', 'floating'] },
    size:      { control: 'select', options: ['xs', 'sm', 'md'] },
    rounded:   { control: 'boolean' },
    background:{ control: 'select', options: ['faint', 'medium', 'bold', 'strong', 'always-dark'] },
    value:     { control: 'text' },
  },
  args: {
    elevation: 'elevated',
    size: 'md',
    rounded: false,
    value: 'list',
  },
};

export default meta;
type Story = StoryObj;

const COL = 'display: flex; flex-direction: column; gap: 12px; align-items: flex-start;';
const ROW = 'display: flex; gap: 8px; align-items: center; flex-wrap: wrap;';
const LBL = 'font-size: 10px; font-family: monospace; color: var(--color-foreground-tertiary, #888); min-width: 80px; flex-shrink: 0;';

const VIEW_ITEMS = [
  { id: 'list',  label: 'List' },
  { id: 'grid',  label: 'Grid' },
  { id: 'map',   label: 'Map' },
];

const VIEW_ICON_ITEMS = [
  { id: 'list', icon: 'List',     label: undefined },
  { id: 'grid', icon: 'GridView', label: undefined },
  { id: 'map',  icon: 'Map',      label: undefined },
];

export const Playground: Story = {
  render: args => html`
    <ds-toggle-button-group
      elevation=${args['elevation'] ?? 'elevated'}
      size=${args['size'] ?? 'md'}
      ?rounded=${args['rounded']}
      background=${args['background'] ?? ''}
      ${ref(el => {
        if (!el) return;
        (el as any).value = args['value'] ?? 'list';
        (el as any).items = VIEW_ITEMS;
      })}
    ></ds-toggle-button-group>
  `,
};

export const ViewToggle: Story = {
  name: 'View Toggle (icon-only, ghost)',
  render: () => html`
    <div style="${COL}">
      <div style="${ROW}">
        <span style="${LBL}">ghost md</span>
        <ds-toggle-button-group
          elevation="none"
          ${ref(el => {
            if (!el) return;
            (el as any).value = 'list';
            (el as any).items = VIEW_ICON_ITEMS;
          })}
        ></ds-toggle-button-group>
      </div>
      <div style="${ROW}">
        <span style="${LBL}">ghost sm</span>
        <ds-toggle-button-group
          elevation="none"
          size="sm"
          ${ref(el => {
            if (!el) return;
            (el as any).value = 'grid';
            (el as any).items = VIEW_ICON_ITEMS;
          })}
        ></ds-toggle-button-group>
      </div>
      <div style="${ROW}">
        <span style="${LBL}">elevated md</span>
        <ds-toggle-button-group
          elevation="elevated"
          ${ref(el => {
            if (!el) return;
            (el as any).value = 'map';
            (el as any).items = VIEW_ITEMS;
          })}
        ></ds-toggle-button-group>
      </div>
      <div style="${ROW}">
        <span style="${LBL}">flat rounded</span>
        <ds-toggle-button-group
          elevation="flat"
          rounded
          ${ref(el => {
            if (!el) return;
            (el as any).value = 'list';
            (el as any).items = VIEW_ITEMS;
          })}
        ></ds-toggle-button-group>
      </div>
    </div>
  `,
};

export const ElevationLevels: Story = {
  render: () => html`
    <div style="${COL}">
      ${(['elevated', 'flat', 'none', 'floating'] as const).map(elev => html`
        <div style="${ROW}">
          <span style="${LBL}">${elev}</span>
          <ds-toggle-button-group
            elevation=${elev}
            ${ref(el => {
              if (!el) return;
              (el as any).value = 'list';
              (el as any).items = VIEW_ITEMS;
            })}
          ></ds-toggle-button-group>
        </div>
      `)}
    </div>
  `,
};
