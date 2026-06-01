import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { ref } from 'lit/directives/ref.js';
import '../../../../dist/components/ds-button.js';
import '../../../../dist/components/ds-button-group.js';
import '../../../../dist/components/ds-icon.js';

const meta: Meta = {
  title: 'Actions/ButtonGroup',
  tags: ['autodocs'],
  argTypes: {
    elevation: { control: 'select', options: ['none', 'flat', 'elevated', 'floating'] },
    size:      { control: 'select', options: ['xs', 'sm', 'md', 'lg'] },
    rounded:   { control: 'boolean' },
  },
  args: {
    elevation: 'flat',
    size: 'md',
    rounded: false,
  },
};

export default meta;
type Story = StoryObj;

const COL = 'display: flex; flex-direction: column; gap: 12px; align-items: flex-start;';
const ROW = 'display: flex; gap: 8px; align-items: center; flex-wrap: wrap;';
const LBL = 'font-size: 10px; font-family: monospace; color: var(--color-foreground-tertiary, #888); min-width: 80px; flex-shrink: 0;';

const FILTER_ITEMS = [
  { label: 'Filter', icon: 'Filter',       variant: 'secondary' as const, intent: 'none' as const },
  { label: 'Sort',   icon: 'SortAscending', variant: 'secondary' as const, intent: 'none' as const },
  { label: 'Export', icon: 'Upload',        variant: 'secondary' as const, intent: 'none' as const },
];

export const Playground: Story = {
  render: args => html`
    <ds-button-group
      elevation=${args['elevation'] ?? 'flat'}
      size=${args['size'] ?? 'md'}
      ?rounded=${args['rounded']}
      ${ref(el => {
        if (!el) return;
        (el as any).items = FILTER_ITEMS;
      })}
    ></ds-button-group>
  `,
};

export const FilterActions: Story = {
  name: 'Filter Actions (3 secondary buttons)',
  render: () => html`
    <div style="${COL}">
      <div style="${ROW}">
        <span style="${LBL}">flat</span>
        <ds-button-group
          elevation="flat"
          ${ref(el => {
            if (!el) return;
            (el as any).items = FILTER_ITEMS;
          })}
        ></ds-button-group>
      </div>
      <div style="${ROW}">
        <span style="${LBL}">elevated</span>
        <ds-button-group
          elevation="elevated"
          ${ref(el => {
            if (!el) return;
            (el as any).items = FILTER_ITEMS;
          })}
        ></ds-button-group>
      </div>
      <div style="${ROW}">
        <span style="${LBL}">ghost</span>
        <ds-button-group
          elevation="none"
          ${ref(el => {
            if (!el) return;
            (el as any).items = FILTER_ITEMS;
          })}
        ></ds-button-group>
      </div>
      <div style="${ROW}">
        <span style="${LBL}">rounded</span>
        <ds-button-group
          elevation="flat"
          rounded
          ${ref(el => {
            if (!el) return;
            (el as any).items = FILTER_ITEMS;
          })}
        ></ds-button-group>
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
          <ds-button-group
            elevation=${elev}
            ${ref(el => {
              if (!el) return;
              (el as any).items = [
                { label: 'First',  variant: 'secondary', intent: 'none' },
                { label: 'Second', variant: 'secondary', intent: 'none' },
                { label: 'Third',  variant: 'secondary', intent: 'none' },
              ];
            })}
          ></ds-button-group>
        </div>
      `)}
    </div>
  `,
};

export const Sizes: Story = {
  render: () => html`
    <div style="${COL}">
      ${(['xs', 'sm', 'md', 'lg'] as const).map(size => html`
        <div style="${ROW}">
          <span style="${LBL}">${size}</span>
          <ds-button-group
            elevation="flat"
            size=${size}
            ${ref(el => {
              if (!el) return;
              (el as any).items = [
                { label: 'Alpha',  variant: 'secondary', intent: 'none' },
                { label: 'Beta',   variant: 'secondary', intent: 'none' },
                { label: 'Gamma',  variant: 'secondary', intent: 'none' },
              ];
            })}
          ></ds-button-group>
        </div>
      `)}
    </div>
  `,
};
