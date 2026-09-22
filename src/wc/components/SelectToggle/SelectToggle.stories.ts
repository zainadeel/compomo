import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-select-toggle.js';
import '../../../../dist/components/ds-data-toolbar.js';
import '../../../../dist/components/ds-icon.js';
import '../../../../dist/components/ds-text.js';

const twoOptions = [
  { value: 'table', label: 'Table', icon: 'Table' },
  { value: 'chart', label: 'Chart', icon: 'Chart' },
];

const threeOptions = [...twoOptions, { value: 'list', label: 'List', icon: 'List' }];

const meta: Meta = {
  title: 'Form/SelectToggle',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A single button that cycles through two or three local choices. The trailing vertical dots show the current position; this is not a dropdown or a native form select.',
      },
    },
  },
  argTypes: {
    value: { control: 'select', options: threeOptions.map(option => option.value) },
    variant: { control: 'select', options: ['label', 'icon', 'icon-label'] },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    width: { control: 'select', options: ['hug', 'fill'] },
    collapseLabel: { control: 'boolean' },
  },
  args: {
    value: 'table',
    variant: 'icon-label',
    size: 'md',
    width: 'hug',
    hasBorder: true,
    collapseLabel: false,
    isInactive: false,
  },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  render: args => html`
    <div style="width:min(100%,var(--dimension-form-width-md));">
      <ds-select-toggle
        .options=${threeOptions}
        value=${args['value'] ?? 'table'}
        variant=${args['variant'] ?? 'icon-label'}
        size=${args['size'] ?? 'md'}
        width=${args['width'] ?? 'hug'}
        .hasBorder=${args['hasBorder'] ?? true}
        .collapseLabel=${args['collapseLabel'] ?? false}
        ?is-inactive=${args['isInactive'] ?? false}
        aria-label="View layout"
      ></ds-select-toggle>
    </div>
  `,
};

export const TwoChoices: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <ds-select-toggle
      .options=${twoOptions}
      value="table"
      aria-label="View layout"
    ></ds-select-toggle>
  `,
};

export const IconOnly: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <ds-select-toggle
      .options=${threeOptions}
      value="chart"
      variant="icon"
      aria-label="View layout"
    ></ds-select-toggle>
  `,
};

export const CompactToolbar: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <ds-data-toolbar style="display:block;width:min(100%,var(--dimension-form-width-md));">
      <ds-select-toggle
        slot="trailing"
        .options=${twoOptions}
        value="table"
        variant="icon-label"
        .collapseLabel=${true}
        aria-label="View layout"
      ></ds-select-toggle>
    </ds-data-toolbar>
  `,
};

export const LabelOnly: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <ds-select-toggle
      .options=${threeOptions}
      value="chart"
      variant="label"
      aria-label="View layout"
    ></ds-select-toggle>
  `,
};

export const Borderless: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="display:flex;align-items:center;gap:var(--dimension-space-200);">
      <ds-select-toggle
        .options=${threeOptions}
        value="table"
        variant="icon-label"
        aria-label="Bordered view layout"
      ></ds-select-toggle>
      <ds-select-toggle
        .options=${threeOptions}
        value="table"
        variant="icon-label"
        .hasBorder=${false}
        aria-label="Borderless view layout"
      ></ds-select-toggle>
    </div>
  `,
};

export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div
      style="display:flex;flex-direction:column;align-items:flex-start;gap:var(--dimension-space-200);"
    >
      ${(['sm', 'md', 'lg'] as const).map(
        size => html`
          <ds-select-toggle
            .options=${threeOptions}
            value="table"
            variant="icon-label"
            size=${size}
            aria-label=${`${size} view layout`}
          ></ds-select-toggle>
        `
      )}
    </div>
  `,
};
