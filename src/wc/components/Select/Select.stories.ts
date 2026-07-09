import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { ref } from 'lit/directives/ref.js';
import '../../../../dist/components/ds-select.js';
import '../../../../dist/components/ds-menu.js';

const FRUIT_OPTIONS = [
  { label: 'Apple', value: 'apple' },
  { label: 'Banana', value: 'banana' },
  { label: 'Cherry', value: 'cherry' },
  { label: 'Date', value: 'date' },
  { label: 'Elderberry', value: 'elderberry' },
];

const STATUS_OPTIONS = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Pending', value: 'pending' },
  { label: 'Suspended', value: 'suspended' },
];

const SIZES = ['md', 'sm', 'xs'] as const;
const WIDTHS = ['hug', 'fill'] as const;

const meta: Meta = {
  title: 'Form/Select',
  tags: ['autodocs'],
  argTypes: {
    value: { control: 'text' },
    placeholder: { control: 'text' },
    size: { control: 'select', options: [...SIZES] },
    width: { control: 'select', options: [...WIDTHS] },
    isInactive: { control: 'boolean' },
    activeFill: { control: 'boolean' },
    hasBorder: { control: 'boolean' },
  },
  args: {
    value: '',
    placeholder: 'Select',
    size: 'md',
    width: 'fill',
    isInactive: false,
    activeFill: true,
    hasBorder: true,
  },
};

export default meta;
type Story = StoryObj;

const COL =
  'display:flex;flex-direction:column;gap:var(--dimension-space-200);align-items:stretch;width:240px;';
const LBL =
  'font-size:var(--typography-fontsize-xs);font-family:monospace;color:var(--color-foreground-tertiary);';

const bindOptions = (options: typeof FRUIT_OPTIONS, value?: string) =>
  ref((el: Element | undefined) => {
    if (!el) return;
    (el as HTMLDsSelectElement).options = options;
    if (value !== undefined) (el as HTMLDsSelectElement).value = value;
  });

export const Playground: Story = {
  render: args => html`
    <div style="width:240px;">
      <ds-select
        value=${args['value'] ?? ''}
        placeholder=${args['placeholder'] ?? 'Select'}
        size=${args['size']}
        width=${args['width']}
        ?is-inactive=${args['isInactive']}
        .activeFill=${args['activeFill']}
        .hasBorder=${args['hasBorder']}
        ${bindOptions(FRUIT_OPTIONS)}
      ></ds-select>
    </div>
  `,
};

/** Side-by-side md / sm / xs — match unfilled-button control density. */
export const Sizes: Story = {
  parameters: { controls: { exclude: ['size'] } },
  render: args => html`
    <div
      style="display:flex;flex-wrap:wrap;align-items:flex-start;gap:var(--dimension-space-300);"
    >
      ${SIZES.map(
        size => html`
          <div style="${COL}">
            <span style="${LBL}">size=${size}</span>
            <ds-select
              size=${size}
              width=${args['width']}
              placeholder=${args['placeholder']}
              .activeFill=${args['activeFill']}
              .hasBorder=${args['hasBorder']}
              ${bindOptions(FRUIT_OPTIONS, 'cherry')}
            ></ds-select>
            <ds-select
              size=${size}
              width=${args['width']}
              placeholder=${args['placeholder']}
              .activeFill=${args['activeFill']}
              .hasBorder=${args['hasBorder']}
              ${bindOptions(FRUIT_OPTIONS)}
            ></ds-select>
          </div>
        `,
      )}
    </div>
  `,
};

/** Hug vs fill in a fixed parent — fill stretches; hug sizes to the label. */
export const Widths: Story = {
  parameters: { controls: { exclude: ['width'] } },
  render: args => html`
    <div
      style="display:flex;flex-direction:column;gap:var(--dimension-space-300);width:320px;"
    >
      ${WIDTHS.map(
        width => html`
          <div style="${COL};width:100%;">
            <span style="${LBL}">width=${width}</span>
            <ds-select
              size=${args['size']}
              width=${width}
              placeholder=${args['placeholder']}
              .activeFill=${args['activeFill']}
              .hasBorder=${args['hasBorder']}
              ${bindOptions(FRUIT_OPTIONS, 'cherry')}
            ></ds-select>
            <ds-select
              size=${args['size']}
              width=${width}
              placeholder=${args['placeholder']}
              .activeFill=${args['activeFill']}
              .hasBorder=${args['hasBorder']}
              ${bindOptions(FRUIT_OPTIONS)}
            ></ds-select>
          </div>
        `,
      )}
    </div>
  `,
};

export const WithPlaceholder: Story = {
  render: () => html`
    <div style="${COL}">
      <span style="${LBL}">No value — placeholder</span>
      <ds-select placeholder="Select" ${bindOptions(FRUIT_OPTIONS, '')}></ds-select>

      <span style="${LBL}">Value selected</span>
      <ds-select ${bindOptions(FRUIT_OPTIONS, 'cherry')}></ds-select>
    </div>
  `,
};

/** Selected fill on/off — primary label, secondary chevron. */
export const ActiveFill: Story = {
  parameters: { controls: { exclude: ['activeFill', 'value'] } },
  render: args => html`
    <div style="${COL}">
      <span style="${LBL}">activeFill=true (default)</span>
      <ds-select
        size=${args['size']}
        width=${args['width']}
        .hasBorder=${args['hasBorder']}
        .activeFill=${true}
        ${bindOptions(FRUIT_OPTIONS, 'cherry')}
      ></ds-select>

      <span style="${LBL}">activeFill=false — primary label, no fill</span>
      <ds-select
        size=${args['size']}
        width=${args['width']}
        .hasBorder=${args['hasBorder']}
        .activeFill=${false}
        ${bindOptions(FRUIT_OPTIONS, 'cherry')}
      ></ds-select>
    </div>
  `,
};

export const Inactive: Story = {
  render: () => html`
    <div style="${COL}">
      <span style="${LBL}">Inactive — no selection</span>
      <ds-select
        is-inactive
        placeholder="Select"
        ${bindOptions(FRUIT_OPTIONS)}
      ></ds-select>

      <span style="${LBL}">Inactive — with selection</span>
      <ds-select is-inactive ${bindOptions(STATUS_OPTIONS, 'active')}></ds-select>
    </div>
  `,
};

export const StatusSelect: Story = {
  name: 'Status Select',
  render: () => html`
    <div style="width:200px;">
      <ds-select placeholder="Select" ${bindOptions(STATUS_OPTIONS)}></ds-select>
    </div>
  `,
};
